import type { ChannelPlugin } from "openclaw/plugin-sdk"
import type { ResolvedAccount, SendPayload } from "./types.js"
import { resolveAccountIds, resolveLineAccount, lineConfigSchema } from "./config.js"
import { consumeReplyToken, registerAccount, unregisterAccount } from "./webhook.js"
import * as client from "./client.js"

// ------------------------------------------------------------------
// Text chunking (LINE max: 5000 chars per message)
// ------------------------------------------------------------------
const TEXT_CHUNK_LIMIT = 5000

function chunkText(text: string): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += TEXT_CHUNK_LIMIT) {
    chunks.push(text.slice(i, i + TEXT_CHUNK_LIMIT))
  }
  return chunks.length > 0 ? chunks : [""]
}

// ------------------------------------------------------------------
// Channel plugin definition
// ------------------------------------------------------------------
export const linePlugin: ChannelPlugin<ResolvedAccount> = {
  id: "line",

  meta: {
    id: "line",
    label: "LINE",
    selectionLabel: "LINE (Messaging API)",
    docsPath: "/channels/line",
    blurb: "LINE Messaging API channel. Supports DMs, groups, Flex Messages, quick replies, and templates.",
    aliases: ["line"],
  },

  capabilities: {
    chatTypes: ["direct", "group"],
    blockStreaming: true,
  },

  config: {
    listAccountIds: (cfg) => resolveAccountIds(cfg as Parameters<typeof resolveAccountIds>[0]),
    resolveAccount: (cfg, accountId) =>
      resolveLineAccount(cfg as Parameters<typeof resolveLineAccount>[0], accountId),
  },

  configSchema: lineConfigSchema,

  security: {
    dmPolicy: {
      getPolicyForSender: (sender, account) => {
        const policy = (account as ResolvedAccount).dmPolicy
        if (policy === "allowlist") {
          const allowed = (account as ResolvedAccount).allowFrom
          return allowed.includes(sender) ? "allow" : "deny"
        }
        return policy === "disabled" ? "deny" : policy
      },
    },
  },

  groups: {
    groupPolicy: {
      getPolicyForGroup: (_groupId, account) => {
        return (account as ResolvedAccount).groupPolicy === "disabled" ? "deny" : "allow"
      },
      getPolicyForSenderInGroup: (sender, _groupId, account) => {
        const policy = (account as ResolvedAccount).groupPolicy
        if (policy === "allowlist") {
          return (account as ResolvedAccount).allowFrom.includes(sender) ? "allow" : "deny"
        }
        return policy === "disabled" ? "deny" : "allow"
      },
    },
  },

  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account as ResolvedAccount
      registerAccount(account)
      ctx.setStatus?.({ ok: true, label: `LINE (${account.webhookPath})` })
    },
    stopAccount: async (ctx) => {
      unregisterAccount((ctx.account as ResolvedAccount).accountId)
    },
  },

  outbound: {
    deliveryMode: "direct",

    sendText: async (params) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = params.context as any
      const account = ctx?.account as ResolvedAccount | undefined
      const chatId: string = ctx?.chatId ?? ctx?.target ?? ""
      const accountId: string = account?.accountId ?? ""
      const token = account?.channelAccessToken ?? ""

      if (!token || !chatId) return { ok: false, error: "Missing account or chatId" }

      const text: string = (params as unknown as { text: string }).text ?? ""
      const chunks = chunkText(text)

      const replyToken = consumeReplyToken(accountId, chatId)

      for (const [i, chunk] of chunks.entries()) {
        if (i === 0 && replyToken) {
          await client.replyText(token, replyToken, chunk)
        } else {
          await client.pushText(token, chatId, chunk)
        }
      }

      return { ok: true }
    },

    sendMedia: async (params) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = params.context as any
      const account = ctx?.account as ResolvedAccount | undefined
      const chatId: string = ctx?.chatId ?? ctx?.target ?? ""
      const token = account?.channelAccessToken ?? ""
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attachment = (params as any).attachment

      if (!token || !chatId) return { ok: false, error: "Missing account or chatId" }

      // Fall back to text description if no URL available
      const url: string | undefined = attachment?.url
      if (url) {
        const ext = url.split(".").pop()?.toLowerCase()
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) {
          await client.pushMessages(token, chatId, [
            {
              type: "image",
              originalContentUrl: url,
              previewImageUrl: url,
            } as unknown as import("@line/bot-sdk").messagingApi.Message,
          ])
          return { ok: true }
        }
      }

      // Text fallback
      const label = attachment?.name ?? attachment?.filename ?? "attachment"
      await client.pushText(token, chatId, `[${label}]${url ? ` ${url}` : ""}`)
      return { ok: true }
    },

    sendPayload: async (params) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = params.context as any
      const account = ctx?.account as ResolvedAccount | undefined
      const chatId: string = ctx?.chatId ?? ctx?.target ?? ""
      const accountId: string = account?.accountId ?? ""
      const token = account?.channelAccessToken ?? ""
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: SendPayload = (params as any).payload?.channelData?.line ?? (params as any).payload ?? {}

      if (!token || !chatId) return { ok: false, error: "Missing account or chatId" }

      const replyToken = consumeReplyToken(accountId, chatId)

      // Quick replies
      if (payload.quickReplies && payload.quickReplies.length > 0) {
        const text = payload.text ?? "\u200B" // zero-width space if no text
        if (replyToken) {
          await client.replyWithQuickReplies(token, replyToken, text, payload.quickReplies)
        } else {
          await client.replyWithQuickReplies(token, "", text, payload.quickReplies)
        }
        return { ok: true }
      }

      // Flex message
      if (payload.flexMessage) {
        await client.pushFlex(
          token,
          chatId,
          payload.flexMessage.altText,
          payload.flexMessage.contents as import("@line/bot-sdk").messagingApi.FlexContainer,
        )
        return { ok: true }
      }

      // Template message
      if (payload.templateMessage) {
        const tmpl = payload.templateMessage
        if (tmpl.type === "confirm") {
          await client.pushTemplate(token, chatId, tmpl.text, {
            type: "confirm",
            text: tmpl.text,
            actions: [
              { type: "postback", label: tmpl.confirmLabel ?? "Yes", data: tmpl.confirmData ?? "yes" },
              { type: "postback", label: tmpl.cancelLabel ?? "No", data: tmpl.cancelData ?? "no" },
            ],
          })
        } else if (tmpl.type === "buttons" && tmpl.actions) {
          await client.pushTemplate(token, chatId, tmpl.text, {
            type: "buttons",
            text: tmpl.text,
            actions: tmpl.actions.map((a) =>
              a.uri
                ? { type: "uri" as const, label: a.label, uri: a.uri }
                : { type: "postback" as const, label: a.label, data: a.data ?? a.label },
            ),
          })
        }
        return { ok: true }
      }

      // Location
      if (payload.location) {
        await client.pushLocation(
          token,
          chatId,
          payload.location.title,
          payload.location.address,
          payload.location.latitude,
          payload.location.longitude,
        )
        return { ok: true }
      }

      // Plain text fallback
      if (payload.text) {
        const chunks = chunkText(payload.text)
        for (const [i, chunk] of chunks.entries()) {
          if (i === 0 && replyToken) {
            await client.replyText(token, replyToken, chunk)
          } else {
            await client.pushText(token, chatId, chunk)
          }
        }
      }

      return { ok: true }
    },
  },

  messaging: {
    targetResolver: {
      looksLikeId: (s: string) => /^[UCR][0-9a-f]{32}$/.test(s),
      resolveTarget: async (id: string) => ({
        id,
        displayName: id,
        type: id.startsWith("U") ? "user" : "group",
      }),
    },
  },

  directory: {
    getProfile: async (userId: string, ctx) => {
      const account = (ctx as unknown as { account: ResolvedAccount }).account
      try {
        const profile = await client.getProfile(account.channelAccessToken, userId)
        return {
          id: userId,
          name: profile.displayName,
          avatarUrl: profile.pictureUrl,
        }
      } catch {
        return { id: userId, name: userId }
      }
    },
  },

  status: {
    getStatus: async (ctx) => {
      const account = ctx.account as ResolvedAccount
      return {
        ok: account.enabled,
        label: `LINE webhook: ${account.webhookPath}`,
        detail: {
          accountId: account.accountId,
          webhookPath: account.webhookPath,
          dmPolicy: account.dmPolicy,
          groupPolicy: account.groupPolicy,
        },
      }
    },
  },

  agentPrompt: {
    getPrompt: () =>
      "This conversation is on LINE. " +
      "You can send Flex Messages, quick replies, confirm templates, and location pins " +
      "by including channelData.line in your response payload. " +
      "Text messages are capped at 5000 characters and split automatically.",
  },
}
