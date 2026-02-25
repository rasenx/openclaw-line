# Plan: Standalone OpenClaw LINE Channel Plugin

**Package name:** `@azmodanz/openclaw-line`
(Uses your npm username as the scope. Create the org at https://www.npmjs.com/org/create before publishing.)

**Why standalone:** `@openclaw/line` is `"private": true` in the monorepo — never published to npm. The `@openclaw/` scope is owned by upstream. We publish under our own scope, installable by anyone.

---

## Architecture Overview

The official monorepo LINE plugin delegates all LINE API calls through internal `runtime.channel.line.*` methods — unavailable outside the monorepo. Our standalone plugin instead:

- Calls **`@line/bot-sdk`** directly for all LINE API operations (same pattern as `@openclaw/zalo` which uses `undici` for direct HTTP calls)
- Registers its own HTTP webhook handler via `api.registerHttpHandler()` in the plugin's `register()` function
- Stores `api.runtime` in a module-level singleton (same pattern as every official extension)
- Dispatches inbound messages through `runtime.channel.reply.*` — the internal pipeline accessed via the untyped runtime object
- Implements the full **`ChannelPlugin<ResolvedAccount>`** interface from `openclaw/plugin-sdk`

---

## Key Architecture Decisions (resolved)

### Q1: npm scope
**→ `@azmodanz/openclaw-line`** — your npm personal scope matching your username.

### Q2: `api.registerHttpHandler` signature
**→ Confirmed from Zalo source:**
```typescript
// Called in register(), NOT in startAccount
api.registerHttpHandler(
  async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    // return true = request handled, false = pass through
  }
)
```
The handler is registered **once globally** in `register(api)`. It inspects `req.url` to route to the right account.

### Q3: replyToken best practice
**→ Per-account in-memory Map with 25s TTL:**

```typescript
// Module-level, keyed by accountId → chatId/userId → replyToken
const replyTokenStore = new Map<string, { token: string; expiresAt: number }>()

// On inbound event: store with 25s TTL (LINE expires tokens after ~30s)
replyTokenStore.set(`${accountId}:${chatId}`, {
  token: replyToken,
  expiresAt: Date.now() + 25_000,
})

// On outbound: consume if still valid, else fall back to push
function consumeReplyToken(accountId: string, chatId: string): string | null {
  const entry = replyTokenStore.get(`${accountId}:${chatId}`)
  if (!entry || Date.now() > entry.expiresAt) return null
  replyTokenStore.delete(`${accountId}:${chatId}`)
  return entry.token
}
```

This is Node.js single-threaded so no race conditions. Tokens auto-expire naturally; the store never grows unboundedly.

### Inbound pipeline (no `api.handleInbound`)
There is no public `api.handleInbound()` method. Inbound dispatch goes through `api.runtime` (stored as singleton), accessed dynamically:

```typescript
const runtime = getRuntime() // module-level singleton set in register()

// Step 1: build inbound context
const ctx = runtime.channel.reply.finalizeInboundContext({ ... })

// Step 2: dispatch through auto-reply pipeline
await runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
  ctx,
  cfg: runtime.config,
  dispatcherOptions: {
    deliver: async (payload) => { /* send reply back to LINE */ },
    onError: (err) => { runtime.error?.(`LINE reply failed: ${err}`) },
  },
})
```

---

## File Structure

```
openclaw-line/
├── index.ts                  # Plugin entry: exports default { id, name, description, configSchema, register(api) }
├── package.json              # npm metadata + openclaw manifest block (no separate openclaw.plugin.json)
├── tsconfig.json             # TypeScript — no emit, jiti runs .ts directly
└── src/
    ├── runtime.ts            # Module-level singleton: setRuntime(api.runtime) / getRuntime()
    ├── config.ts             # Zod schema for account config (tokens, policies, webhookPath)
    ├── types.ts              # ResolvedAccount, SendPayload, shared interfaces
    ├── client.ts             # @line/bot-sdk wrapper: reply, push, flex, template, media, profile
    ├── webhook.ts            # HTTP handler: signature validation + event → pipeline dispatch
    ├── channel.ts            # ChannelPlugin<ResolvedAccount> definition
    └── card-command.ts       # /card slash command (Flex Message presets)
```

---

## Step-by-Step Implementation Plan

### Step 1 — Project Scaffold

**`package.json`:**
```json
{
  "name": "@azmodanz/openclaw-line",
  "version": "1.0.0",
  "type": "module",
  "files": ["index.ts", "src/"],
  "dependencies": {
    "@line/bot-sdk": "^9.x",
    "zod": "^3.x"
  },
  "peerDependencies": {
    "openclaw": ">=2026.1.0"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "line",
      "label": "LINE",
      "docsPath": "/channels/line"
    },
    "install": {
      "npmSpec": "@azmodanz/openclaw-line"
    }
  }
}
```

**`tsconfig.json`:** `moduleResolution: bundler`, `target: ES2022`, no `outDir` (no build step — OpenClaw uses `jiti` to run `.ts` files directly).

---

### Step 2 — Runtime Singleton (`src/runtime.ts`)

```typescript
import type { PluginRuntime } from "openclaw/plugin-sdk"

let _runtime: PluginRuntime | null = null

export function setRuntime(runtime: PluginRuntime) {
  _runtime = runtime
}

export function getRuntime(): PluginRuntime {
  if (!_runtime) throw new Error("LINE plugin runtime not initialized")
  return _runtime
}
```

Called as `setRuntime(api.runtime)` inside `register()`. Used by the webhook handler to dispatch inbound messages.

---

### Step 3 — Config Schema (`src/config.ts`)

Zod schema supporting both flat (single account) and multi-account layouts:

```typescript
const lineAccountSchema = z.object({
  channelAccessToken: z.string(),
  channelSecret: z.string(),
  webhookPath: z.string().default("/line/webhook"),
  dmPolicy: z.enum(["pairing", "allowlist", "open", "disabled"]).default("pairing"),
  groupPolicy: z.enum(["allowlist", "open", "disabled"]).default("open"),
  allowFrom: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

// Top-level: flat OR accounts map
const lineConfigSchema = z.object({
  channels: z.object({
    line: z.union([
      lineAccountSchema,
      z.object({ accounts: z.record(lineAccountSchema) })
    ]).optional()
  }).optional()
})
```

`resolveLineAccount(cfg, accountId)` normalizes both layouts into a single `ResolvedAccount`.

---

### Step 4 — Types (`src/types.ts`)

```typescript
export type ResolvedAccount = {
  accountId: string
  channelAccessToken: string
  channelSecret: string
  webhookPath: string
  dmPolicy: "pairing" | "allowlist" | "open" | "disabled"
  groupPolicy: "allowlist" | "open" | "disabled"
  allowFrom: string[]
}

export type SendPayload = {
  text?: string
  quickReplies?: string[]
  flexMessage?: { altText: string; contents: object }
  templateMessage?: object
  location?: { title: string; address: string; latitude: number; longitude: number }
}
```

---

### Step 5 — LINE Client Wrapper (`src/client.ts`)

Stateless wrapper around `@line/bot-sdk`'s `MessagingApiClient`. Each method takes `channelAccessToken` explicitly to support multi-account.

| Method | LINE API |
|--------|----------|
| `replyText(token, replyToken, text)` | `POST /v2/bot/message/reply` |
| `replyMessages(token, replyToken, messages[])` | Reply with up to 5 messages |
| `pushText(token, to, text)` | `POST /v2/bot/message/push` |
| `pushFlex(token, to, altText, contents)` | Push Flex Message |
| `pushTemplate(token, to, altText, template)` | Push Template Message |
| `pushLocation(token, to, title, address, lat, lng)` | Push location pin |
| `replyWithQuickReplies(token, replyToken, text, items[])` | Reply + quick reply buttons |
| `getProfile(token, userId)` | `GET /v2/bot/profile/{userId}` |
| `getContent(token, messageId)` | Download media blob |

Clients are cached per `channelAccessToken` to avoid re-instantiation on every call.

---

### Step 6 — Webhook Handler (`src/webhook.ts`)

Single `(req, res) => Promise<boolean>` function registered via `api.registerHttpHandler()`.

**Flow:**

```
req comes in
  └─ check req.url matches any account's webhookPath?
       ├─ no  → return false (pass through)
       └─ yes → read raw body (using readJsonBodyWithLimit from openclaw/plugin-sdk)
                  ├─ GET request → return 200 OK (LINE webhook verification)
                  └─ POST request
                       ├─ validate x-line-signature (HMAC-SHA256, reject 401 if invalid)
                       ├─ parse events[]
                       └─ for each event:
                            ├─ store replyToken in replyTokenStore (25s TTL)
                            ├─ normalize to inbound context
                            └─ dispatch via runtime.channel.reply.*
```

**Event normalization table:**

| LINE source/event | → OpenClaw inbound context |
|-------------------|---------------------------|
| `source.type: "user"` | `chatType: "dm"`, `chatId: source.userId` |
| `source.type: "group"` | `chatType: "group"`, `chatId: source.groupId` |
| `source.type: "room"` | `chatType: "group"`, `chatId: source.roomId` |
| `message.type: "text"` | `text: message.text` |
| `message.type: "image/video/audio/file"` | `attachments[]` with `getContent()` download URL |
| `message.type: "location"` | `text: "[Location] title\naddress\nlat, lng"` |
| `message.type: "sticker"` | `text: "[Sticker: packageId/stickerId]"` |
| `event.type: "follow"` | `text: "[User followed]"` |
| `event.type: "join"` | `text: "[Bot joined group]"` |
| `event.type: "postback"` | `text: event.postback.data` |
| other event types | skip (return early) |

---

### Step 7 — Channel Plugin (`src/channel.ts`)

Implements `ChannelPlugin<ResolvedAccount>` from `openclaw/plugin-sdk`.

#### `capabilities`
```typescript
{ chatTypes: ["direct", "group"], blockStreaming: true }
```

#### `config`
```typescript
{
  listAccountIds: (cfg) => resolveAccountIds(cfg),
  resolveAccount: (cfg, accountId) => resolveLineAccount(cfg, accountId),
}
```

#### `security` — DM policy enforcement
- `pairing`: trigger pairing flow for unknown senders
- `allowlist`: reject senders not in `allowFrom[]`
- `open`: accept all
- `disabled`: drop all

#### `groups` — Group policy enforcement
- `open`: accept all group messages
- `allowlist`: only from listed group IDs
- `disabled`: drop all group messages

#### `gateway`
```typescript
{
  startAccount: async (ctx) => {
    // ctx: ChannelGatewayContext<ResolvedAccount>
    // Probe LINE API to validate token, update ctx.setStatus()
    const bot = await client.getProfile(ctx.account.channelAccessToken, "me")
    ctx.setStatus({ ok: true, label: bot.displayName })
  },
  stopAccount: async (ctx) => {
    // Clean up replyTokenStore entries for this account
    cleanupReplyTokens(ctx.accountId)
  }
}
```

Note: `api.registerHttpHandler()` is called in `register()`, not here. `startAccount` is only for per-account lifecycle (probe, status).

#### `outbound`
```typescript
{
  deliveryMode: "direct",

  sendText: async ({ text, context }) => {
    const chunks = chunkText(text, 5000)
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

  sendMedia: async ({ attachment, context }) => {
    // Push image URL if available, else text fallback
  },

  sendPayload: async ({ payload, context }) => {
    // Handle channelData.line: quickReplies, flexMessage, templateMessage, location
  }
}
```

#### `messaging`
```typescript
{
  targetResolver: {
    looksLikeId: (s) => /^[UCR][0-9a-f]{32}$/.test(s),
    resolveTarget: async (id) => ({
      id,
      displayName: id,
      type: id.startsWith("U") ? "user" : "group"
    })
  }
}
```

#### `directory`
```typescript
{
  getProfile: async (userId, { account }) => {
    const p = await client.getProfile(account.channelAccessToken, userId)
    return { id: userId, name: p.displayName, avatarUrl: p.pictureUrl }
  }
}
```

#### `status`
Return: webhook URL, accountId, token prefix (first 8 chars), last event timestamp.

#### `agentPrompt`
Append to agent context: LINE supports Flex Messages, quick replies, and template messages via `channelData.line`.

---

### Step 8 — Entry Point (`index.ts`)

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import { setRuntime } from "./src/runtime"
import { linePlugin } from "./src/channel"
import { createLineWebhookHandler } from "./src/webhook"
import { registerCardCommands } from "./src/card-command"
import { lineConfigSchema } from "./src/config"

export default {
  id: "line",
  name: "LINE",
  description: "LINE Messaging API channel for OpenClaw",
  configSchema: lineConfigSchema,
  register(api: OpenClawPluginApi) {
    setRuntime(api.runtime)                              // store runtime singleton
    api.registerChannel({ plugin: linePlugin })          // register channel adapters
    api.registerHttpHandler(createLineWebhookHandler())  // register webhook endpoint
    registerCardCommands(api)                            // register /card command
  },
}
```

---

### Step 9 — `/card` Command (`src/card-command.ts`)

Registers a non-agent slash command that sends Flex Message presets directly.

| Command | Output |
|---------|--------|
| `/card info "Title" "Body"` | Info bubble (header + body) |
| `/card image <url> "Caption"` | Hero image bubble |
| `/card action "Title" "Label" <url>` | Bubble with CTA button |
| `/card confirm "Question" "Yes" "No"` | Confirm template |
| `/card buttons "Title" btn1 btn2...` | Button template |

Parses quoted strings, builds Flex/Template JSON, calls `sendPayload` on the current chat.

---

### Step 10 — Testing

Use **vitest** (zero-config TypeScript, no build step needed).

| Test | What it covers |
|------|---------------|
| `config.test.ts` | Flat + multi-account config parsing, missing fields, defaults |
| `webhook.test.ts` | Signature validation (valid/invalid/missing), event normalization for all types |
| `client.test.ts` | API call shapes (mocked `fetch`), chunking at 5000 chars |
| `reply-token.test.ts` | Store/consume/expire flow, fallback to push after expiry |
| `card-command.test.ts` | Argument parser for all card types, quoted string handling |

---

### Step 11 — npm Publish

**Pre-publish checklist:**
- [ ] Create npm org scope: https://www.npmjs.com/org/create → use `azmodanz`
- [ ] `"files": ["index.ts", "src/"]` — no compiled output needed
- [ ] `README.md` written
- [ ] All tests passing
- [ ] Version `1.0.0`

```bash
npm login
npm publish --access public
```

**Users install with:**
```bash
openclaw plugins install @azmodanz/openclaw-line
```

---

## Dependencies

| Package | Type | Role |
|---------|------|------|
| `@line/bot-sdk` | dependency | Official LINE Messaging API client |
| `zod` | dependency | Config schema validation |
| `openclaw` | peerDependency | Host runtime + `openclaw/plugin-sdk` types |
| `typescript` | devDependency | Type checking |
| `vitest` | devDependency | Unit tests |
| `@types/node` | devDependency | Node.js types (`IncomingMessage`, `ServerResponse`) |

---

## Out of Scope (v1)

- Reactions — not supported by LINE API
- Threads — not supported by LINE API
- Streaming — LINE doesn't support partial delivery
- OAuth flow — LINE uses static tokens only
- Webhook redelivery deduplication — future enhancement
