import * as crypto from "node:crypto"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { ReplyTokenEntry, ResolvedAccount } from "./types.js"
import { getRuntime } from "./runtime.js"

// ------------------------------------------------------------------
// Reply token store: accountId:chatId → { token, expiresAt }
// Tokens expire after 25s (LINE invalidates them at ~30s)
// ------------------------------------------------------------------
const REPLY_TOKEN_TTL_MS = 25_000
const replyTokenStore = new Map<string, ReplyTokenEntry>()

export function storeReplyToken(accountId: string, chatId: string, token: string): void {
  replyTokenStore.set(`${accountId}:${chatId}`, {
    token,
    expiresAt: Date.now() + REPLY_TOKEN_TTL_MS,
  })
}

export function consumeReplyToken(accountId: string, chatId: string): string | null {
  const key = `${accountId}:${chatId}`
  const entry = replyTokenStore.get(key)
  if (!entry || Date.now() > entry.expiresAt) {
    replyTokenStore.delete(key)
    return null
  }
  replyTokenStore.delete(key)
  return entry.token
}

export function cleanupReplyTokens(accountId: string): void {
  for (const key of replyTokenStore.keys()) {
    if (key.startsWith(`${accountId}:`)) replyTokenStore.delete(key)
  }
}

// ------------------------------------------------------------------
// Signature validation
// ------------------------------------------------------------------
function validateSignature(body: string, secret: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64")
  // constant-time compare to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// ------------------------------------------------------------------
// Raw body reader
// ------------------------------------------------------------------
function readRawBody(req: IncomingMessage, limitBytes = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error("Request body too large"))
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

// ------------------------------------------------------------------
// Event normalization
// ------------------------------------------------------------------
type NormalizedEvent = {
  sender: string
  chatType: "dm" | "group"
  chatId: string
  text: string
  replyToken?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvent(event: any): NormalizedEvent | null {
  const source = event.source
  if (!source) return null

  const sender: string = source.userId ?? "unknown"
  const chatType: "dm" | "group" = source.type === "user" ? "dm" : "group"
  const chatId: string =
    source.type === "user"
      ? source.userId
      : source.groupId ?? source.roomId ?? source.userId

  let text = ""

  switch (event.type) {
    case "message": {
      const msg = event.message
      switch (msg.type) {
        case "text":
          text = msg.text ?? ""
          break
        case "image":
          text = `[Image id:${msg.id}]`
          break
        case "video":
          text = `[Video id:${msg.id}]`
          break
        case "audio":
          text = `[Audio id:${msg.id}]`
          break
        case "file":
          text = `[File: ${msg.fileName ?? msg.id}]`
          break
        case "location":
          text = [
            `[Location] ${msg.title ?? ""}`,
            msg.address,
            `${msg.latitude}, ${msg.longitude}`,
          ]
            .filter(Boolean)
            .join("\n")
          break
        case "sticker":
          text = `[Sticker: ${msg.packageId}/${msg.stickerId}]`
          break
        default:
          text = `[${msg.type} message]`
      }
      break
    }
    case "follow":
      text = "[User followed the bot]"
      break
    case "join":
      text = "[Bot joined a group or room]"
      break
    case "postback":
      text = event.postback?.data ?? "[postback]"
      break
    case "memberJoined":
      text = "[Member joined the group]"
      break
    case "unfollow":
    case "leave":
      // No meaningful text to process; skip
      return null
    default:
      return null
  }

  return {
    sender,
    chatType,
    chatId,
    text,
    replyToken: event.replyToken,
  }
}

// ------------------------------------------------------------------
// Webhook handler factory
// Returns a handler that checks all registered accounts' webhookPaths
// ------------------------------------------------------------------
let _accounts: Map<string, ResolvedAccount> = new Map()

export function registerAccount(account: ResolvedAccount): void {
  _accounts.set(account.accountId, account)
}

export function unregisterAccount(accountId: string): void {
  _accounts.delete(accountId)
  cleanupReplyTokens(accountId)
}

export function createLineWebhookHandler() {
  return async function handleLineWebhook(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<boolean> {
    const url = req.url ?? ""

    // Find the account whose webhookPath matches
    let matched: ResolvedAccount | undefined
    for (const account of _accounts.values()) {
      if (url === account.webhookPath || url.startsWith(account.webhookPath + "?")) {
        matched = account
        break
      }
    }
    if (!matched) return false

    const account = matched

    // LINE webhook verification (GET)
    if (req.method === "GET") {
      res.writeHead(200)
      res.end("OK")
      return true
    }

    if (req.method !== "POST") {
      res.writeHead(405)
      res.end("Method Not Allowed")
      return true
    }

    // Read raw body (required for signature validation)
    let rawBody: string
    try {
      rawBody = await readRawBody(req)
    } catch {
      res.writeHead(400)
      res.end("Bad Request")
      return true
    }

    // Validate signature
    const signature = req.headers["x-line-signature"] as string | undefined
    if (!signature || !validateSignature(rawBody, account.channelSecret, signature)) {
      res.writeHead(401)
      res.end("Unauthorized")
      return true
    }

    // Parse events
    let payload: { events: unknown[] }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      res.writeHead(400)
      res.end("Invalid JSON")
      return true
    }

    // Respond immediately (LINE requires fast response)
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ ok: true }))

    // Process events asynchronously
    const runtime = getRuntime()

    for (const event of payload.events ?? []) {
      const normalized = normalizeEvent(event)
      if (!normalized) continue

      const { sender, chatType, chatId, text, replyToken } = normalized

      // Store reply token for outbound handler
      if (replyToken) {
        storeReplyToken(account.accountId, chatId, replyToken)
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (runtime as any).channel.reply.finalizeInboundContext({
          channelId: "line",
          accountId: account.accountId,
          sender,
          chatType,
          chatId,
          text,
          source: "line",
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (runtime as any).channel.reply.dispatchReplyWithBufferedBlockDispatcher({
          ctx,
          cfg: (runtime as any).config,
          dispatcherOptions: {
            deliver: async (outPayload: unknown) => {
              // Outbound delivery is handled by the channel plugin's outbound adapter
              // The runtime calls linePlugin.outbound.sendText / sendPayload
              // This deliver callback is a no-op here — the channel adapter owns delivery
              void outPayload
            },
            onError: (err: unknown) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(runtime as any).error?.(
                `[@rasenx/openclaw-line] Reply dispatch error for ${chatId}: ${String(err)}`,
              )
            },
          },
        })
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(runtime as any).error?.(
          `[@rasenx/openclaw-line] Failed to process event from ${sender}: ${String(err)}`,
        )
      }
    }

    return true
  }
}
