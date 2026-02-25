# Research: OpenClaw, LINE Messaging API, and LINE Channel Plugin

**Compiled:** 2026-02-26

---

## VERIFICATION (2026-02-26)

This section records what was directly confirmed from live sources (GitHub API, npm registry API) on 2026-02-26. Each claim is marked EXISTS, DOES NOT EXIST, or CANNOT VERIFY with the evidence.

---

### 1. Does https://github.com/openclaw/openclaw exist?

**EXISTS. Confirmed.**

Evidence from GitHub REST API (`api.github.com/repos/openclaw/openclaw`):

- Full name: `openclaw/openclaw`
- Description: "Your own personal AI assistant. Any OS. Any Platform. The lobster way."
- Language: TypeScript
- License: MIT
- Default branch: `main`
- Created: 2024-11-24
- Last pushed: 2026-02-25
- Stars: 228,418 (as of query time)
- Forks: 43,767

Note: The original research stated "approximately 140,000 stars and 20,000 forks." The actual current figures are significantly higher (228k stars, 43k forks). The project has grown substantially.

---

### 2. Does extensions/ exist? What is in it?

**EXISTS. Confirmed.**

The `extensions/` directory exists at the root of the `main` branch. It contains 36 subdirectories. Full list confirmed from `api.github.com/repos/openclaw/openclaw/contents/extensions`:

```
bluebubbles, copilot-proxy, device-pair, diagnostics-otel, discord,
feishu, google-gemini-cli-auth, googlechat, imessage, irc, line,
llm-task, lobster, matrix, mattermost, memory-core, memory-lancedb,
minimax-portal-auth, msteams, nextcloud-talk, nostr, open-prose,
phone-control, qwen-portal-auth, shared, signal, slack, synology-chat,
talk-voice, telegram, test-utils, thread-ownership, tlon, twitch,
voice-call, whatsapp, zalo, zalouser
```

---

### 3. Does extensions/line/ exist?

**EXISTS. Confirmed.**

Contents confirmed from `api.github.com/repos/openclaw/openclaw/contents/extensions/line`:

```
extensions/line/
├── index.ts
├── openclaw.plugin.json
├── package.json
└── src/
    ├── card-command.ts
    ├── channel.logout.test.ts
    ├── channel.sendPayload.test.ts
    ├── channel.startup.test.ts
    ├── channel.ts
    └── runtime.ts
```

The actual `package.json` (confirmed verbatim):
```json
{
  "name": "@openclaw/line",
  "version": "2026.2.25",
  "private": true,
  "description": "OpenClaw LINE channel plugin",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "line",
      "label": "LINE",
      "selectionLabel": "LINE (Messaging API)",
      "docsPath": "/channels/line",
      "docsLabel": "line",
      "blurb": "LINE Messaging API bot for Japan/Taiwan/Thailand markets.",
      "order": 75,
      "quickstartAllowFrom": true
    },
    "install": {
      "npmSpec": "@openclaw/line",
      "localPath": "extensions/line",
      "defaultChoice": "npm"
    }
  }
}
```

Important: `"private": true` — this means the package is NOT intended to be published to npm from this monorepo location.

The actual `openclaw.plugin.json` (confirmed verbatim):
```json
{
  "id": "line",
  "channels": ["line"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

The actual `index.ts` entry point (confirmed verbatim):
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { registerLineCardCommand } from "./src/card-command.js";
import { linePlugin } from "./src/channel.js";
import { setLineRuntime } from "./src/runtime.js";

const plugin = {
  id: "line",
  name: "LINE",
  description: "LINE Messaging API channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setLineRuntime(api.runtime);
    api.registerChannel({ plugin: linePlugin });
    registerLineCardCommand(api);
  },
};

export default plugin;
```

Note: The entry point exports a **plain object** with a `register(api)` method, not a function. The original research showed `export default function(api) { ... }` — that is incorrect. The actual pattern is `export default plugin` where `plugin` is an object with `{ id, name, description, configSchema, register(api) {} }`.

The `runtime.ts` is a minimal module-level singleton:
```typescript
import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setLineRuntime(r: PluginRuntime): void {
  runtime = r;
}

export function getLineRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("LINE runtime not initialized - plugin not registered");
  }
  return runtime;
}
```

The `channel.ts` is large (~400 lines) and implements the full `ChannelPlugin<ResolvedLineAccount>` interface including: `pairing`, `capabilities`, `config`, `security`, `groups`, `messaging`, `directory`, `setup`, `outbound`, `status`, `gateway`, and `agentPrompt`.

---

### 4. Does @openclaw/line exist on npm?

**DOES NOT EXIST on npm.**

Evidence: `registry.npmjs.org/@openclaw/line` returns `{"error":"Not found"}` (HTTP 200 with error body — the package simply does not exist in the npm registry).

This is consistent with the `package.json` having `"private": true`.

The `install.npmSpec` field in `package.json` says `"@openclaw/line"`, and the documentation says `openclaw plugins install @openclaw/line`. This means the install command is the intended interface, but the package has not yet been published to the public npm registry. It may be published through a separate CI/CD step, distributed via a private registry, or the docs describe the intended future install path.

---

### 5. What @openclaw packages ARE published on npm?

Confirmed from `registry.npmjs.org/-/v1/search?text=@openclaw`:

**Official @openclaw scope packages (published, public):**

| Package | Version | Description |
|---------|---------|-------------|
| `@openclaw/voice-call` | 2026.2.24 | OpenClaw voice-call plugin |
| `@openclaw/bluebubbles` | 2026.2.24 | OpenClaw BlueBubbles channel plugin |
| `@openclaw/feishu` | 2026.2.24 | OpenClaw Feishu/Lark channel plugin |
| `@openclaw/matrix` | 2026.2.24 | OpenClaw Matrix channel plugin |
| `@openclaw/msteams` | 2026.2.24 | OpenClaw Microsoft Teams channel plugin |
| `@openclaw/zalo` | 2026.2.24 | OpenClaw Zalo channel plugin |

All published under `steipete@gmail.com` as publisher. There is no `@openclaw/line` in this list.

Also present but not in the `@openclaw` scope:
- `openclaw` (core package, 3.8M monthly downloads, version 2026.2.24)
- Various community forks and plugins (`@m1heng-clawd/feishu`, `openclaw-cn`, `@marshulll/openclaw-wecom`, etc.)

**Notable absence:** `@openclaw/line`, `@openclaw/discord`, `@openclaw/signal`, `@openclaw/slack`, `@openclaw/telegram`, `@openclaw/whatsapp` are not published as npm packages. These channels are likely either bundled in the core `openclaw` package or the LINE plugin has not yet been split out for separate npm publication.

---

### 6. How do other channel plugins look? (Reference implementation)

Confirmed from reading `extensions/line/src/channel.ts` directly. The plugin uses:

- `import { ..., type ChannelPlugin } from "openclaw/plugin-sdk"` — all types and helpers come from the SDK
- `export const linePlugin: ChannelPlugin<ResolvedLineAccount> = { ... }` — the plugin is typed against a generic
- `api.runtime` provides all channel runtime helpers (LINE API calls, text chunking, logging, config writing) — the plugin does NOT import `@line/bot-sdk` directly; it uses `getLineRuntime().channel.line.*` wrappers
- The `gateway.startAccount` method calls `getLineRuntime().channel.line.monitorLineProvider(...)` to start the webhook listener
- Text chunking limit is 5,000 characters (LINE's max per text message)

**Key correction to original research section 1.5:** The channel plugin interface shown in the original research is a reasonable approximation but not exact. The actual pattern:
- Entry point exports an **object** (not a function): `export default { id, name, description, configSchema, register(api) {} }`
- The `ChannelPlugin` type uses a generic (`ChannelPlugin<ResolvedLineAccount>`)
- All LINE API calls are mediated through `api.runtime` (the plugin-sdk runtime), not through direct SDK imports
- The `outbound` section has three methods: `sendPayload`, `sendText`, and `sendMedia` (not just `sendText`)
- `deliveryMode: "direct"` and `blockStreaming: true` (not `streaming: false`) are the actual capability flags used

---

### 7. Does the OpenClaw plugin / channel docs exist?

**EXISTS (in the repo). Cannot verify live docs site independently (blocked by 403).**

The following documentation files are confirmed to exist in the `docs/` directory of the repo:

- `docs/channels/line.md` — EXISTS. Contains full LINE plugin setup documentation including install command, config schema, env vars, webhook setup, and multi-account examples.
- `docs/tools/plugin.md` — EXISTS. Full plugin system documentation.
- `docs/plugins/manifest.md` — EXISTS. Plugin manifest (`openclaw.plugin.json`) documentation.

The `docs/channels/` directory contains 29 channel documentation files including `line.md`.

The `docs/tools/plugin.md` lists LINE as an officially supported plugin via `openclaw plugins install @openclaw/line`, but LINE is NOT listed in the "Available plugins (official)" section the same way Matrix, Zalo, MsTeams, and Voice Call are. LINE is a channel, not listed as a separate plugin entry in that doc section.

Whether `https://docs.openclaw.ai/channels/line` serves these files live could not be verified (HTTP 403 from fetch tools), but the source files exist in the repo.

---

### Summary of Corrections to Original Research

| Claim in original research | Verdict | Correction |
|---|---|---|
| Repo exists at github.com/openclaw/openclaw | CORRECT | Confirmed |
| Language: TypeScript, License: MIT | CORRECT | Confirmed |
| "~140k stars, ~20k forks" | WRONG (outdated) | Actual: 228k stars, 43k forks as of 2026-02-25 |
| extensions/ directory exists | CORRECT | Confirmed, 36 subdirectories |
| extensions/line/ exists | CORRECT | Confirmed |
| `@openclaw/line` is an npm package | UNVERIFIED / LIKELY WRONG | The package does NOT exist in the public npm registry. `package.json` has `"private": true`. The install command `openclaw plugins install @openclaw/line` is documented but the package is not published. |
| Plugin entry point is `export default function(api) { ... }` | WRONG | Actual: `export default plugin` where `plugin` is `{ id, name, description, configSchema, register(api) {} }` |
| Plugin imports @line/bot-sdk directly | CANNOT CONFIRM / LIKELY WRONG | The plugin uses `getLineRuntime().channel.line.*` helpers from the SDK runtime; no direct `@line/bot-sdk` import is visible in the source files confirmed |
| `openclaw.plugin.json` content | CORRECT | Confirmed verbatim |
| File structure of extensions/line/ | MOSTLY CORRECT | Actual src/ files: `card-command.ts`, `channel.logout.test.ts`, `channel.sendPayload.test.ts`, `channel.startup.test.ts`, `channel.ts`, `runtime.ts`. Original research noted "(channel monitor logic)", "(LINE SDK integration)", "(card command handlers)" — accurate in spirit |
| Supported features (DMs, groups, media, Flex, templates, quick replies) | CORRECT | Confirmed from channel.ts capabilities and outbound implementation |
| Text chunk limit: 5,000 characters | CORRECT | Confirmed (`textChunkLimit: 5000` in channel.ts) |
| `blockStreaming: true` (not reactions, not threads) | CORRECT | Confirmed from capabilities object |
| Webhook path default `/line/webhook` | CORRECT | Confirmed from docs/channels/line.md |
| Pairing system and ID format (U/C/R + 32 hex) | CORRECT | Confirmed from channel.ts `messaging.targetResolver.looksLikeId` regex |
| `/card` command exists | CORRECT | Confirmed, implemented in `card-command.ts` |
| Card types: info, image, action, list, receipt, confirm, buttons | CORRECT | Confirmed from card-command.ts switch statement |
| learnclawdbot.org reference | CANNOT VERIFY | This third-party docs site could not be verified |

---

## Table of Contents

1. [OpenClaw Framework](#1-openclaw-framework)
   - [What Is It?](#11-what-is-it)
   - [Architecture](#12-architecture)
   - [Channel System](#13-channel-system)
   - [Plugin / Extension System](#14-plugin--extension-system)
   - [Channel Plugin Interface (Code Patterns)](#15-channel-plugin-interface-code-patterns)
2. [LINE Messaging API](#2-line-messaging-api)
   - [Overview](#21-overview)
   - [Webhooks](#22-webhooks)
   - [Message Types](#23-message-types)
   - [Webhook Event Types](#24-webhook-event-types)
   - [Channel Access Token Types](#25-channel-access-token-types)
   - [Core API Methods](#26-core-api-methods)
   - [Official SDKs](#27-official-sdks)
   - [Flex Messages](#28-flex-messages)
3. [Existing LINE Channel Plugin for OpenClaw](#3-existing-line-channel-plugin-for-openclaw)
   - [Status](#31-status)
   - [Installation](#32-installation)
   - [Configuration](#33-configuration)
   - [Webhook Setup](#34-webhook-setup)
   - [Supported Features](#35-supported-features)
   - [Access Control](#36-access-control)
   - [Rich Message Types](#37-rich-message-types)
   - [Plugin Source Layout](#38-plugin-source-layout)
4. [Key URLs and References](#4-key-urls-and-references)

---

## 1. OpenClaw Framework

### 1.1 What Is It?

OpenClaw is a **personal AI assistant** — not a traditional chatbot framework or CRM. It is designed to run locally on your own hardware (any OS) and present a persistent AI identity across all the messaging channels you already use.

The project describes itself as: *"Your own personal AI assistant. Any OS. Any Platform."*

- **GitHub:** https://github.com/openclaw/openclaw
- **Website:** https://openclaw.ai/
- **License:** MIT
- **Language:** TypeScript
- **Category:** Personal AI assistant / autonomous agent with multi-channel inbox

The project was previously known as "Clawdbot" and before that "Moltbot". As of early 2026, the main repo had approximately 140,000 stars and 20,000 forks.

OpenClaw is distinct from a bot framework because:
- It has a **persistent identity** (soul, memory, skills) rather than stateless request/response
- It is **local-first** — runs on your own machine/server
- It **connects to channels you already use**, rather than being a hosted platform
- It supports autonomous agent behavior with tools and memory

### 1.2 Architecture

The core runtime is a **Gateway WebSocket control plane**:

- Default address: `ws://127.0.0.1:18789`
- The Gateway is the single control plane for sessions, channels, tools, and events
- Multiple clients connect to the Gateway: CLI, mobile apps, web UI, device nodes
- The agent runtime runs as an RPC service, processing messages with tool streaming and block streaming
- Message routing flows: `Channel Monitor → Gateway → Auto-Reply Router → Agent Runtime → Channel Outbound`

Key configuration files in the workspace (`~/.openclaw/`):
- `AGENTS.md` — Agent persona / instructions
- `SOUL.md` — Persistent identity
- `TOOLS.md` — Tool definitions
- `skills/<skill>/SKILL.md` — Individual skills

Key source files (from deepwiki analysis):
- `src/web/autoreply.ts` — Channel routing and access control
- `src/plugins/loader.ts` — Plugin discovery and loading
- `src/config/types.tools.ts` — Type definitions

### 1.3 Channel System

OpenClaw uses a **Channel Monitor Pattern** where each channel adapter runs inside the Gateway process. Each monitor:

1. Authenticates with the messaging platform (tokens, OAuth, or local protocols)
2. Listens for inbound messages via polling, webhooks, or persistent connections
3. **Normalizes** the message into a unified `InboundContext` / `MessageEnvelope` format
4. Applies channel-specific policies (DM policy, group policies, allowlists)
5. Forwards the normalized payload to the auto-reply system
6. Delivers outbound replies back to the platform

**Built-in channels** (included in core):
- WhatsApp (via Baileys)
- Telegram (via grammY)
- Discord (via discord.js)
- Slack (via Bolt SDK)
- Signal (via signal-cli)
- iMessage (via imsg CLI)
- Google Chat

**Extension channels** (distributed as npm packages, installed as plugins):
- `@openclaw/matrix` — Matrix
- `@openclaw/msteams` — Microsoft Teams
- `@openclaw/zalo` — Zalo
- `@openclaw/line` — LINE (**exists, documented**)
- And many others (IRC, Feishu/Lark, Synology Chat, Twitch, etc.)

**Unified message envelope format** (injected by channel monitors):
```
[{Channel} {Location} id:{chatId} {Timestamp}]
Sender: {SenderName} (@{username})

{message text}
```

**Channel access control policies:**
- `pairing` (default) — Unknown senders get a pairing code; blocked until approved
- `allowlist` — Only explicitly listed user IDs can message
- `open` — All messages accepted
- `disabled` — All DMs ignored

**Gateway RPC endpoints for channels:**
- `channels.list` — List configured channels
- `channels.status` — Health check per channel
- `channels.restart` — Restart a channel monitor

**Multi-account support:** Each channel can manage multiple accounts, resolved by `accountId` or defaulting to the first enabled account.

### 1.4 Plugin / Extension System

**Discovery order (at gateway startup):**
1. Configured file/directory paths (`plugins.load.paths`)
2. Workspace extensions (`.openclaw/extensions/`)
3. Global extensions (`~/.openclaw/extensions/`)
4. Bundled extensions (in `extensions/` directory of the repo)

Each plugin requires an `openclaw.plugin.json` manifest in its root. When multiple plugins share the same ID, the first discovered wins.

**Plugin manifest structure (`package.json` `openclaw` field, or `openclaw.plugin.json`):**

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "matrix",
      "label": "Matrix",
      "docsPath": "/channels/matrix"
    },
    "install": {
      "npmSpec": "@openclaw/matrix@^2026.2.20"
    }
  }
}
```

Or as a standalone `openclaw.plugin.json`:
```json
{
  "id": "line",
  "channels": ["line"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

**Plugin types supported:**

| Type | Purpose | Example |
|------|---------|---------|
| Channel | Messaging platform integration | `@openclaw/line`, `@openclaw/matrix` |
| Auth Provider | OAuth/token authentication | `@openclaw/google-gemini-cli-auth` |
| Hook | Lifecycle event handlers | `before_agent_start`, `message:received` |
| Tool Extension | Agent tool capabilities | voice_call, browser |
| Gateway RPC | Custom API endpoints | — |
| CLI Command | New command-line operations | — |
| Auto-reply Command | Non-agent slash commands | `/card` |
| Background Service | Long-running processes | — |
| Skills | Packaged automation in `skills/` dirs | — |

**Installation methods:**
```bash
# From npm
openclaw plugins install @openclaw/line

# From local path (development)
openclaw plugins install ./extensions/line
```

**Configuration layout:** Channel config lives under `channels.<id>` (NOT `plugins.entries`). Plugin config lives under `plugins.entries.<id>`.

**Security model for plugins:**
- File system: workspace-constrained (no symlink escapes)
- Network: subject to SSRF policy
- Process spawn: restricted by tool policy
- Config writes: RPC-only via `config.apply`
- Gateway control: rate-limited RPC methods only

### 1.5 Channel Plugin Interface (Code Patterns)

Channel plugins must export a default function that calls `api.registerChannel()`. The minimal required structure:

```typescript
// extensions/acmechat/index.ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) =>
      Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"],
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // Deliver text to your channel
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

**Inbound message normalization** (the core of a channel monitor):

```typescript
export async function monitorChannel(
  config: ChannelConfig,
  handlers: ChannelHandlers
): Promise<ChannelMonitor> {
  // handlers provides:
  //   handlers.sendMessage(envelope) - deliver replies
  //   handlers.reportPresence(status) - health reporting
  //   handlers.triggerPairing(userId) - send pairing codes
}

// Inbound messages are normalized to MessageEnvelope:
const envelope: MessageEnvelope = {
  sender: "user-id-string",
  text: "message content",
  chatType: "dm" | "group" | "main" | "channel" | "thread",
  chatId: "group-or-channel-id",
  threadId: "optional-thread-id",
  attachments: [], // images, files, etc.
};
```

**Optional adapters a channel plugin can implement:**

| Adapter | Purpose |
|---------|---------|
| `setup` | Configuration wizard |
| `security` | Direct message policies |
| `status` | Health diagnostics |
| `gateway` | Lifecycle management (start/stop/login) |
| `mentions` | User mention handling |
| `threading` | Message thread support |
| `streaming` | Real-time message updates |
| `actions` | Custom message operations |
| `commands` | Native command behavior |

**Hook system:**

```typescript
export const hooks = {
  'before_agent_start': async (context) => {
    // Modify agent config before execution
  },
  'message:received': async (envelope, context) => {
    // Process inbound message
  }
};
```

**Config schema validation** uses Zod:
```typescript
export const myChannelConfigSchema = z.object({
  channelAccessToken: z.string(),
  channelSecret: z.string(),
});
```

**Extensions in the main repo** (reference implementations to study):
- `extensions/telegram/` — grammY-based persistent connection
- `extensions/matrix/` — Protocol client (homeserver connection)
- `extensions/msteams/` — Bot Framework integration
- `extensions/zalo/` — REST API polling pattern
- `extensions/line/` — LINE Messaging API webhook receiver
- `extensions/discord/` — discord.js integration
- `extensions/whatsapp/` — Baileys-based WebSocket client

---

## 2. LINE Messaging API

### 2.1 Overview

**Developer console:** https://developers.line.biz/console/
**Documentation root:** https://developers.line.biz/en/docs/messaging-api/overview/
**API Reference:** https://developers.line.biz/en/reference/messaging-api/

The LINE Messaging API enables developers to build bots ("LINE Official Accounts") that interact with users on the LINE platform. All communication flows over HTTPS in JSON format.

**Communication flow:**
1. User sends a message to a LINE Official Account
2. LINE Platform POSTs a webhook event to the bot server's configured webhook URL
3. Bot server processes the event and calls LINE's Reply/Push API to respond

The API is free to use initially, with message quotas determined by the Official Account's subscription plan.

### 2.2 Webhooks

**Webhook delivery:** HTTP POST to your registered webhook URL. The request body is JSON.

**Signature validation** (mandatory before processing):
- Header: `x-line-signature`
- Algorithm: HMAC-SHA256 using the channel secret as the key, applied to the raw request body bytes
- Encoding: Base64
- The raw request body string must be used as-is — parsing/deserializing before verification will cause failure

Verification example (OpenSSL):
```bash
echo -n '{"destination":"U8e742f61...","events":[]}' | \
  openssl dgst -sha256 -hmac 'your-channel-secret' -binary | \
  openssl base64
```

**Webhook envelope structure:**
```json
{
  "destination": "U8e742f61...",
  "events": [
    {
      "type": "message",
      "mode": "active",
      "timestamp": 1462629479859,
      "source": {
        "type": "user",
        "userId": "U4af4980629..."
      },
      "webhookEventId": "01FMGE...",
      "deliveryContext": {
        "isRedelivery": false
      },
      "replyToken": "nHuyWiB7yP...",
      "message": {
        "id": "444573844083572737",
        "type": "text",
        "text": "Hello, world"
      }
    }
  ]
}
```

**Key fields:**
- `destination` — LINE user ID of the bot
- `webhookEventId` — Use to detect duplicate deliveries (webhook redelivery feature)
- `replyToken` — One-time token for reply API (valid for a short window)
- `source.type` — `user` | `group` | `room`
- `source.userId` — LINE user ID of the sender

**Webhook redelivery:** Can be enabled in channel settings. If enabled, LINE will retry failed webhooks. Use `webhookEventId` for idempotency.

**Asynchronous processing is recommended** to avoid queuing delays.

### 2.3 Message Types

Inbound message objects (inside a message event):

| Type | Description |
|------|-------------|
| `text` | Plain text (and text v2) |
| `sticker` | LINE sticker |
| `image` | Image file |
| `video` | Video file |
| `audio` | Audio file |
| `file` | Arbitrary file |
| `location` | Latitude/longitude + address |

Outbound message types (what bots can send):

| Type | Description |
|------|-------------|
| `text` | Plain text |
| `sticker` | LINE sticker |
| `image` | Image by URL |
| `video` | Video by URL |
| `audio` | Audio by URL |
| `location` | Map pin |
| `imagemap` | Tappable image map |
| `template` | Buttons/confirm/carousel template |
| `flex` | Flex Message (custom card layout) |
| `coupon` | LINE coupon |

**Media retrieval:** Use the message ID from the webhook event to download images, videos, audio, and files via the content API. Files are automatically deleted after a period.

### 2.4 Webhook Event Types

| Event Type | Trigger |
|-----------|---------|
| `message` | User sends a message |
| `unsend` | User deletes a sent message |
| `follow` | User adds the account as a friend |
| `unfollow` | User unfriends / blocks the account |
| `join` | Bot is added to a group or room |
| `leave` | Bot is removed from a group or room |
| `memberJoined` | A member joins a group containing the bot |
| `memberLeft` | A member leaves a group containing the bot |
| `postback` | User taps a postback action button |
| `videoPlayComplete` | User finishes watching a video |
| `beacon` | User approaches a beacon device |
| `accountLink` | User links their account |
| `membership` | Membership status changes |

### 2.5 Channel Access Token Types

| Type | Validity | Limit | Notes |
|------|----------|-------|-------|
| Stateless | 15 minutes | Unlimited issuances | Cannot be revoked before expiry; generate per-request |
| Short-lived | 30 days | 30 per channel | Oldest auto-revoked if limit exceeded |
| Long-lived | No expiry | 1 per channel | Generated from LINE Developers Console; manual revocation |

**Reference:** https://developers.line.biz/en/docs/messaging-api/channel-access-tokens/

For production bots, **stateless tokens** are recommended for security (no persistent token to protect). **Long-lived tokens** are common in simple/development setups.

### 2.6 Core API Methods

**Reply Message** (respond to an inbound event using its `replyToken`):
```
POST https://api.line.me/v2/bot/message/reply
```
- `replyToken` — from the webhook event
- `messages` — array of message objects (max 5)
- Free to use; replyToken expires quickly

**Push Message** (send to a user at any time):
```
POST https://api.line.me/v2/bot/message/push
```
- `to` — LINE user ID, group ID, or room ID
- `messages` — array of message objects
- Counts against quota

**Multicast** (push to multiple users):
```
POST https://api.line.me/v2/bot/message/multicast
```

**Broadcast** (push to all followers):
```
POST https://api.line.me/v2/bot/message/broadcast
```

**Narrowcast** (push to audience segment):
```
POST https://api.line.me/v2/bot/message/narrowcast
```

**Get User Profile:**
```
GET https://api.line.me/v2/bot/profile/{userId}
```

**All requests require:** `Authorization: Bearer {channel_access_token}`

### 2.7 Official SDKs

**Official SDKs maintained by LINE:**

| Language | Package / Repo |
|----------|---------------|
| Node.js | `@line/bot-sdk` — https://github.com/line/line-bot-sdk-nodejs |
| Python | `line-bot-sdk` — https://github.com/line/line-bot-sdk-python |
| Java | https://github.com/line/line-bot-sdk-java |
| PHP | https://github.com/line/line-bot-sdk-php |
| Go | https://github.com/line/line-bot-sdk-go |
| Ruby | https://github.com/line/line-bot-sdk-ruby |

**Node.js SDK usage (TypeScript):**

```typescript
import * as line from '@line/bot-sdk';
import express from 'express';

const config: line.ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new line.messagingApi.MessagingApiClient(config);
const app = express();

// Middleware handles signature validation automatically
app.post('/callback', line.middleware(config), async (req, res) => {
  const events: line.WebhookEvent[] = req.body.events;
  await Promise.all(events.map(handleEvent));
  res.json({ ok: true });
});

async function handleEvent(event: line.WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: event.message.text }],
  });
}

app.listen(3000);
```

**SDK docs:** https://line.github.io/line-bot-sdk-nodejs/

**Alternative SDKs (community):**
- `bottender` (Node.js) — Multi-platform bot framework including LINE
- `messaging-api-line` (Node.js) — Standalone LINE API client
- OpenAPI Generator — Generate client from LINE's OpenAPI spec for any language

### 2.8 Flex Messages

Flex Messages are fully custom card-like messages defined in JSON. They are the richest outbound message type.

**Container types:**
- `bubble` — Single card
- `carousel` — Horizontally scrollable list of bubbles

**Layout structure:** Container → Blocks (header/hero/body/footer) → Components (text/image/button/box/separator/spacer)

**Minimal bubble example:**
```json
{
  "type": "flex",
  "altText": "This is a Flex Message",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "Hello, World!",
          "weight": "bold",
          "size": "xl"
        }
      ]
    }
  }
}
```

**Tool for designing Flex Messages:** [Flex Message Simulator](https://developers.line.biz/flex-simulator/) — Visual designer that outputs JSON.

---

## 3. Existing LINE Channel Plugin for OpenClaw

### 3.1 Status

**The LINE channel plugin exists and is officially maintained** as part of the OpenClaw monorepo.

- **Plugin package:** `@openclaw/line`
- **Source location (monorepo):** `extensions/line/` in https://github.com/openclaw/openclaw
- **Documentation:** https://docs.openclaw.ai/channels/line
- **Third-party docs mirror:** https://www.learnclawdbot.org/docs/channels/line

It is an **extension channel** (not built-in), meaning it must be installed separately.

### 3.2 Installation

```bash
# Install from npm registry
openclaw plugins install @openclaw/line

# Or, install from local monorepo checkout (development)
openclaw plugins install ./extensions/line
```

### 3.3 Configuration

Minimal configuration in OpenClaw's config file:
```json
{
  "channels": {
    "line": {
      "enabled": true,
      "channelAccessToken": "LINE_CHANNEL_ACCESS_TOKEN",
      "channelSecret": "LINE_CHANNEL_SECRET",
      "dmPolicy": "pairing"
    }
  }
}
```

Using environment variables (preferred for production):
```bash
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
```

Using secret files (alternative):
```json
{
  "channels": {
    "line": {
      "tokenFile": "/path/to/line-token.txt",
      "secretFile": "/path/to/line-secret.txt"
    }
  }
}
```

Multi-account setup with separate webhook paths:
```json
{
  "channels": {
    "line": {
      "accounts": {
        "marketing": {
          "channelAccessToken": "...",
          "channelSecret": "...",
          "webhookPath": "/line/marketing"
        },
        "support": {
          "channelAccessToken": "...",
          "channelSecret": "...",
          "webhookPath": "/line/support"
        }
      }
    }
  }
}
```

### 3.4 Webhook Setup

1. In the LINE Developers Console, create a Messaging API channel
2. Enable "Use webhook" in the Messaging API settings
3. Set the webhook URL to: `https://<your-gateway-host>/line/webhook`
   - HTTPS is required by LINE
   - For multi-account, use custom paths like `/line/marketing`
4. Copy the Channel access token and Channel secret into your config

The OpenClaw Gateway handles:
- **GET** requests — LINE's webhook verification challenge
- **POST** requests — Inbound webhook events from LINE

### 3.5 Supported Features

| Feature | Supported |
|---------|-----------|
| Direct messages (1:1) | Yes |
| Group chats | Yes |
| Text messages | Yes |
| Image, video, audio, file | Yes |
| Location messages | Yes |
| Flex Messages | Yes |
| Template messages | Yes |
| Quick replies | Yes |
| Streaming responses | Yes (buffers until complete, shows loading animation) |
| Reactions | No |
| Threads | No |

**Text chunking:** Messages over 5,000 characters are automatically split.

**Markdown handling:** Markdown is stripped; code blocks and tables are converted into Flex cards when possible.

**Media downloads:** Capped at `channels.line.mediaMaxMb` (default: 10 MB).

### 3.6 Access Control

**DM policy options** (`channels.line.dmPolicy`):
- `pairing` (default) — Unknown users receive a pairing code; blocked until approved
- `allowlist` — Only listed LINE user IDs can message
- `open` — All DMs accepted
- `disabled` — All DMs ignored

**Group policy options** (`channels.line.groupPolicy`):
- `allowlist` — Only users in group allowlist accepted
- `open` — All group messages accepted
- `disabled` — Group messages ignored

**Allowlist configuration:**
```json
{
  "channels": {
    "line": {
      "dmPolicy": "allowlist",
      "allowFrom": ["Uabcdef1234..."],
      "groupPolicy": "open",
      "groups": {
        "Cabcdef1234...": {
          "allowFrom": ["Uabcdef1234..."]
        }
      }
    }
  }
}
```

**LINE ID formats:**
- User ID: `U` + 32 hex characters (e.g., `U4af4980629...`)
- Group ID: `C` + 32 hex characters
- Room ID: `R` + 32 hex characters

**Pairing management commands:**
```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

### 3.7 Rich Message Types

The plugin supports sending LINE-specific rich content via `channelData`:

```json
{
  "text": "Here you go",
  "channelData": {
    "line": {
      "quickReplies": ["Status", "Help", "Cancel"],
      "location": {
        "title": "Our Office",
        "address": "123 Main St, Tokyo",
        "latitude": 35.681236,
        "longitude": 139.767125
      },
      "flexMessage": {
        "altText": "Status card",
        "contents": {
          "type": "bubble",
          "body": { }
        }
      },
      "templateMessage": {
        "type": "confirm",
        "text": "Proceed?",
        "confirmLabel": "Yes",
        "confirmData": "yes",
        "cancelLabel": "No",
        "cancelData": "no"
      }
    }
  }
}
```

**Built-in `/card` command** for quick Flex presets:
```
/card info "Welcome" "Thanks for joining!"
```

### 3.8 Plugin Source Layout

```
extensions/line/
├── index.ts               # Plugin entry point — registers channel with api.registerChannel()
├── openclaw.plugin.json   # Plugin manifest (id: "line", channels: ["line"])
├── package.json           # npm package metadata
└── src/                   # Source modules
    ├── (channel monitor logic)
    ├── (LINE SDK integration)
    └── (card command handlers)
```

**Manifest content (`openclaw.plugin.json`):**
```json
{
  "id": "line",
  "channels": ["line"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

**Entry point pattern (`index.ts`):**
```typescript
import { setLineRuntime } from './src/...';
import { registerCardCommands } from './src/...';

export default function (api: OpenClawPluginApi) {
  setLineRuntime(api);
  api.registerChannel({ plugin: lineChannelPlugin });
  registerCardCommands(api);
}
```

---

## 4. Key URLs and References

### OpenClaw

| Resource | URL |
|----------|-----|
| GitHub (main repo) | https://github.com/openclaw/openclaw |
| Website | https://openclaw.ai/ |
| Official docs | https://docs.openclaw.ai/ |
| Plugin docs | https://docs.openclaw.ai/tools/plugin |
| Channels overview (DeepWiki) | https://deepwiki.com/openclaw/openclaw/8-channels |
| Extensions & Plugins (DeepWiki) | https://deepwiki.com/openclaw/openclaw/10-extensions-and-plugins |
| Architecture deep dive (DeepWiki) | https://deepwiki.com/openclaw/openclaw/15.1-architecture-deep-dive |
| Extensions directory (GitHub) | https://github.com/openclaw/openclaw/tree/main/extensions |
| LINE extension (GitHub) | https://github.com/openclaw/openclaw/tree/main/extensions/line |
| LINE channel docs (official) | https://docs.openclaw.ai/channels/line |
| LINE channel docs (learnclawdbot) | https://www.learnclawdbot.org/docs/channels/line |
| Discord extension (DeepWiki) | https://deepwiki.com/openclaw/openclaw/8.6-discord-integration |
| DingTalk plugin discussion | https://github.com/openclaw/openclaw/discussions/2647 |
| Zalo plugin PR (reference) | https://github.com/openclaw/openclaw/pull/7142 |
| Architecture article | https://ppaolo.substack.com/p/openclaw-system-architecture-overview |
| Releases | https://github.com/openclaw/openclaw/releases |

### LINE Messaging API

| Resource | URL |
|----------|-----|
| Developer Console | https://developers.line.biz/console/ |
| Messaging API Overview | https://developers.line.biz/en/docs/messaging-api/overview/ |
| Receiving Messages (Webhooks) | https://developers.line.biz/en/docs/messaging-api/receiving-messages/ |
| Sending Messages | https://developers.line.biz/en/docs/messaging-api/sending-messages/ |
| Verify Webhook Signature | https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/ |
| Channel Access Tokens | https://developers.line.biz/en/docs/messaging-api/channel-access-tokens/ |
| Flex Messages | https://developers.line.biz/en/docs/messaging-api/using-flex-messages/ |
| Flex Message Elements | https://developers.line.biz/en/docs/messaging-api/flex-message-elements/ |
| Flex Message Simulator | https://developers.line.biz/flex-simulator/ |
| API Reference | https://developers.line.biz/en/reference/messaging-api/ |
| Official SDKs page | https://developers.line.biz/en/docs/messaging-api/line-bot-sdk/ |

### LINE SDKs (GitHub)

| SDK | URL |
|-----|-----|
| Node.js (`@line/bot-sdk`) | https://github.com/line/line-bot-sdk-nodejs |
| Node.js docs | https://line.github.io/line-bot-sdk-nodejs/ |
| Python | https://github.com/line/line-bot-sdk-python |
| Java | https://github.com/line/line-bot-sdk-java |
| PHP | https://github.com/line/line-bot-sdk-php |
| Go | https://github.com/line/line-bot-sdk-go |
| Ruby | https://github.com/line/line-bot-sdk-ruby |
| LINE OpenAPI spec | https://github.com/line/line-openapi |

---

## ACTUAL SOURCE CODE (extensions/line/)

All files fetched directly from `https://raw.githubusercontent.com/openclaw/openclaw/main/extensions/line/` on 2026-02-26.

---

### extensions/line/package.json

```json
{
  "name": "@openclaw/line",
  "version": "2026.2.25",
  "private": true,
  "description": "OpenClaw LINE channel plugin",
  "type": "module",
  "openclaw": {
    "extensions": [
      "./index.ts"
    ],
    "channel": {
      "id": "line",
      "label": "LINE",
      "selectionLabel": "LINE (Messaging API)",
      "docsPath": "/channels/line",
      "docsLabel": "line",
      "blurb": "LINE Messaging API bot for Japan/Taiwan/Thailand markets.",
      "order": 75,
      "quickstartAllowFrom": true
    },
    "install": {
      "npmSpec": "@openclaw/line",
      "localPath": "extensions/line",
      "defaultChoice": "npm"
    }
  }
}
```

---

### extensions/line/openclaw.plugin.json

```json
{
  "id": "line",
  "channels": ["line"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

---

### extensions/line/index.ts

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { registerLineCardCommand } from "./src/card-command.js";
import { linePlugin } from "./src/channel.js";
import { setLineRuntime } from "./src/runtime.js";

const plugin = {
  id: "line",
  name: "LINE",
  description: "LINE Messaging API channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setLineRuntime(api.runtime);
    api.registerChannel({ plugin: linePlugin });
    registerLineCardCommand(api);
  },
};

export default plugin;
```

---

### extensions/line/src/runtime.ts

```typescript
import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setLineRuntime(r: PluginRuntime): void {
  runtime = r;
}

export function getLineRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("LINE runtime not initialized - plugin not registered");
  }
  return runtime;
}
```

---

### extensions/line/src/channel.ts

This is the main channel plugin implementation (~600+ lines). It exports `linePlugin: ChannelPlugin<ResolvedLineAccount>`.

```typescript
import {
  buildChannelConfigSchema,
  buildTokenChannelStatusSummary,
  DEFAULT_ACCOUNT_ID,
  LineConfigSchema,
  processLineMessage,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  type ChannelPlugin,
  type ChannelStatusIssue,
  type OpenClawConfig,
  type LineConfig,
  type LineChannelData,
  type ResolvedLineAccount,
} from "openclaw/plugin-sdk";
import { getLineRuntime } from "./runtime.js";

// LINE channel metadata
const meta = {
  id: "line",
  label: "LINE",
  selectionLabel: "LINE (Messaging API)",
  detailLabel: "LINE Bot",
  docsPath: "/channels/line",
  docsLabel: "line",
  blurb: "LINE Messaging API bot for Japan/Taiwan/Thailand markets.",
  systemImage: "message.fill",
};

export const linePlugin: ChannelPlugin<ResolvedLineAccount> = {
  id: "line",
  meta: {
    ...meta,
    quickstartAllowFrom: true,
  },
  pairing: {
    idLabel: "lineUserId",
    normalizeAllowEntry: (entry) => {
      // LINE IDs are case-sensitive; only strip prefix variants (line: / line:user:).
      return entry.replace(/^line:(?:user:)?/i, "");
    },
    notifyApproval: async ({ cfg, id }) => {
      const line = getLineRuntime().channel.line;
      const account = line.resolveLineAccount({ cfg });
      if (!account.channelAccessToken) {
        throw new Error("LINE channel access token not configured");
      }
      await line.pushMessageLine(id, "OpenClaw: your access has been approved.", {
        channelAccessToken: account.channelAccessToken,
      });
    },
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    threads: false,
    media: true,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.line"] },
  configSchema: buildChannelConfigSchema(LineConfigSchema),
  config: {
    listAccountIds: (cfg) => getLineRuntime().channel.line.listLineAccountIds(cfg),
    resolveAccount: (cfg, accountId) =>
      getLineRuntime().channel.line.resolveLineAccount({ cfg, accountId: accountId ?? undefined }),
    defaultAccountId: (cfg) => getLineRuntime().channel.line.resolveDefaultLineAccountId(cfg),
    setAccountEnabled: ({ cfg, accountId, enabled }) => {
      const lineConfig = (cfg.channels?.line ?? {}) as LineConfig;
      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...cfg,
          channels: {
            ...cfg.channels,
            line: {
              ...lineConfig,
              enabled,
            },
          },
        };
      }
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          line: {
            ...lineConfig,
            accounts: {
              ...lineConfig.accounts,
              [accountId]: {
                ...lineConfig.accounts?.[accountId],
                enabled,
              },
            },
          },
        },
      };
    },
    deleteAccount: ({ cfg, accountId }) => {
      const lineConfig = (cfg.channels?.line ?? {}) as LineConfig;
      if (accountId === DEFAULT_ACCOUNT_ID) {
        // oxlint-disable-next-line no-unused-vars
        const { channelSecret, tokenFile, secretFile, ...rest } = lineConfig;
        return {
          ...cfg,
          channels: {
            ...cfg.channels,
            line: rest,
          },
        };
      }
      const accounts = { ...lineConfig.accounts };
      delete accounts[accountId];
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          line: {
            ...lineConfig,
            accounts: Object.keys(accounts).length > 0 ? accounts : undefined,
          },
        },
      };
    },
    isConfigured: (account) =>
      Boolean(account.channelAccessToken?.trim() && account.channelSecret?.trim()),
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.channelAccessToken?.trim() && account.channelSecret?.trim()),
      tokenSource: account.tokenSource ?? undefined,
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      (
        getLineRuntime().channel.line.resolveLineAccount({ cfg, accountId: accountId ?? undefined })
          .config.allowFrom ?? []
      ).map((entry) => String(entry)),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => {
          // LINE sender IDs are case-sensitive; keep original casing.
          return entry.replace(/^line:(?:user:)?/i, "");
        }),
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      const resolvedAccountId = accountId ?? account.accountId ?? DEFAULT_ACCOUNT_ID;
      const useAccountPath = Boolean(
        (cfg.channels?.line as LineConfig | undefined)?.accounts?.[resolvedAccountId],
      );
      const basePath = useAccountPath
        ? `channels.line.accounts.${resolvedAccountId}.`
        : "channels.line.";
      return {
        policy: account.config.dmPolicy ?? "pairing",
        allowFrom: account.config.allowFrom ?? [],
        policyPath: `${basePath}dmPolicy`,
        allowFromPath: basePath,
        approveHint: "openclaw pairing approve line <code>",
        normalizeEntry: (raw) => raw.replace(/^line:(?:user:)?/i, ""),
      };
    },
    collectWarnings: ({ account, cfg }) => {
      const defaultGroupPolicy = resolveDefaultGroupPolicy(cfg);
      const { groupPolicy } = resolveAllowlistProviderRuntimeGroupPolicy({
        providerConfigPresent: cfg.channels?.line !== undefined,
        groupPolicy: account.config.groupPolicy,
        defaultGroupPolicy,
      });
      if (groupPolicy !== "open") {
        return [];
      }
      return [
        `- LINE groups: groupPolicy="open" allows any member in groups to trigger. Set channels.line.groupPolicy="allowlist" + channels.line.groupAllowFrom to restrict senders.`,
      ];
    },
  },
  groups: {
    resolveRequireMention: ({ cfg, accountId, groupId }) => {
      const account = getLineRuntime().channel.line.resolveLineAccount({
        cfg,
        accountId: accountId ?? undefined,
      });
      const groups = account.config.groups;
      if (!groups || !groupId) {
        return false;
      }
      const groupConfig = groups[groupId] ?? groups["*"];
      return groupConfig?.requireMention ?? false;
    },
  },
  messaging: {
    normalizeTarget: (target) => {
      const trimmed = target.trim();
      if (!trimmed) {
        return undefined;
      }
      return trimmed.replace(/^line:(group|room|user):/i, "").replace(/^line:/i, "");
    },
    targetResolver: {
      looksLikeId: (id) => {
        const trimmed = id?.trim();
        if (!trimmed) {
          return false;
        }
        // LINE user IDs are typically U followed by 32 hex characters
        // Group IDs are C followed by 32 hex characters
        // Room IDs are R followed by 32 hex characters
        return /^[UCR][a-f0-9]{32}$/i.test(trimmed) || /^line:/i.test(trimmed);
      },
      hint: "<userId|groupId|roomId>",
    },
  },
  directory: {
    self: async () => null,
    listPeers: async () => [],
    listGroups: async () => [],
  },
  setup: {
    resolveAccountId: ({ accountId }) =>
      getLineRuntime().channel.line.normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) => {
      const lineConfig = (cfg.channels?.line ?? {}) as LineConfig;
      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...cfg,
          channels: {
            ...cfg.channels,
            line: {
              ...lineConfig,
              name,
            },
          },
        };
      }
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          line: {
            ...lineConfig,
            accounts: {
              ...lineConfig.accounts,
              [accountId]: {
                ...lineConfig.accounts?.[accountId],
                name,
              },
            },
          },
        },
      };
    },
    validateInput: ({ accountId, input }) => {
      const typedInput = input as {
        useEnv?: boolean;
        channelAccessToken?: string;
        channelSecret?: string;
        tokenFile?: string;
        secretFile?: string;
      };
      if (typedInput.useEnv && accountId !== DEFAULT_ACCOUNT_ID) {
        return "LINE_CHANNEL_ACCESS_TOKEN can only be used for the default account.";
      }
      if (!typedInput.useEnv && !typedInput.channelAccessToken && !typedInput.tokenFile) {
        return "LINE requires channelAccessToken or --token-file (or --use-env).";
      }
      if (!typedInput.useEnv && !typedInput.channelSecret && !typedInput.secretFile) {
        return "LINE requires channelSecret or --secret-file (or --use-env).";
      }
      return null;
    },
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const typedInput = input as {
        name?: string;
        useEnv?: boolean;
        channelAccessToken?: string;
        channelSecret?: string;
        tokenFile?: string;
        secretFile?: string;
      };
      const lineConfig = (cfg.channels?.line ?? {}) as LineConfig;

      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...cfg,
          channels: {
            ...cfg.channels,
            line: {
              ...lineConfig,
              enabled: true,
              ...(typedInput.name ? { name: typedInput.name } : {}),
              ...(typedInput.useEnv
                ? {}
                : typedInput.tokenFile
                  ? { tokenFile: typedInput.tokenFile }
                  : typedInput.channelAccessToken
                    ? { channelAccessToken: typedInput.channelAccessToken }
                    : {}),
              ...(typedInput.useEnv
                ? {}
                : typedInput.secretFile
                  ? { secretFile: typedInput.secretFile }
                  : typedInput.channelSecret
                    ? { channelSecret: typedInput.channelSecret }
                    : {}),
            },
          },
        };
      }

      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          line: {
            ...lineConfig,
            enabled: true,
            accounts: {
              ...lineConfig.accounts,
              [accountId]: {
                ...lineConfig.accounts?.[accountId],
                enabled: true,
                ...(typedInput.name ? { name: typedInput.name } : {}),
                ...(typedInput.tokenFile
                  ? { tokenFile: typedInput.tokenFile }
                  : typedInput.channelAccessToken
                    ? { channelAccessToken: typedInput.channelAccessToken }
                    : {}),
                ...(typedInput.secretFile
                  ? { secretFile: typedInput.secretFile }
                  : typedInput.channelSecret
                    ? { channelSecret: typedInput.channelSecret }
                    : {}),
              },
            },
          },
        },
      };
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: (text, limit) => getLineRuntime().channel.text.chunkMarkdownText(text, limit),
    textChunkLimit: 5000, // LINE allows up to 5000 characters per text message
    sendPayload: async ({ to, payload, accountId, cfg }) => {
      const runtime = getLineRuntime();
      const lineData = (payload.channelData?.line as LineChannelData | undefined) ?? {};
      const sendText = runtime.channel.line.pushMessageLine;
      const sendBatch = runtime.channel.line.pushMessagesLine;
      const sendFlex = runtime.channel.line.pushFlexMessage;
      const sendTemplate = runtime.channel.line.pushTemplateMessage;
      const sendLocation = runtime.channel.line.pushLocationMessage;
      const sendQuickReplies = runtime.channel.line.pushTextMessageWithQuickReplies;
      const buildTemplate = runtime.channel.line.buildTemplateMessageFromPayload;
      const createQuickReplyItems = runtime.channel.line.createQuickReplyItems;

      let lastResult: { messageId: string; chatId: string } | null = null;
      const quickReplies = lineData.quickReplies ?? [];
      const hasQuickReplies = quickReplies.length > 0;
      const quickReply = hasQuickReplies ? createQuickReplyItems(quickReplies) : undefined;

      // oxlint-disable-next-line typescript/no-explicit-any
      const sendMessageBatch = async (messages: Array<Record<string, unknown>>) => {
        if (messages.length === 0) {
          return;
        }
        for (let i = 0; i < messages.length; i += 5) {
          // LINE SDK expects Message[] but we build dynamically
          const batch = messages.slice(i, i + 5) as unknown as Parameters<typeof sendBatch>[1];
          const result = await sendBatch(to, batch, {
            verbose: false,
            accountId: accountId ?? undefined,
          });
          lastResult = { messageId: result.messageId, chatId: result.chatId };
        }
      };

      const processed = payload.text
        ? processLineMessage(payload.text)
        : { text: "", flexMessages: [] };

      const chunkLimit =
        runtime.channel.text.resolveTextChunkLimit?.(cfg, "line", accountId ?? undefined, {
          fallbackLimit: 5000,
        }) ?? 5000;

      const chunks = processed.text
        ? runtime.channel.text.chunkMarkdownText(processed.text, chunkLimit)
        : [];
      const mediaUrls = payload.mediaUrls ?? (payload.mediaUrl ? [payload.mediaUrl] : []);
      const shouldSendQuickRepliesInline = chunks.length === 0 && hasQuickReplies;

      if (!shouldSendQuickRepliesInline) {
        if (lineData.flexMessage) {
          // LINE SDK expects FlexContainer but we receive contents as unknown
          const flexContents = lineData.flexMessage.contents as Parameters<typeof sendFlex>[2];
          lastResult = await sendFlex(to, lineData.flexMessage.altText, flexContents, {
            verbose: false,
            accountId: accountId ?? undefined,
          });
        }

        if (lineData.templateMessage) {
          const template = buildTemplate(lineData.templateMessage);
          if (template) {
            lastResult = await sendTemplate(to, template, {
              verbose: false,
              accountId: accountId ?? undefined,
            });
          }
        }

        if (lineData.location) {
          lastResult = await sendLocation(to, lineData.location, {
            verbose: false,
            accountId: accountId ?? undefined,
          });
        }

        for (const flexMsg of processed.flexMessages) {
          // LINE SDK expects FlexContainer but we receive contents as unknown
          const flexContents = flexMsg.contents as Parameters<typeof sendFlex>[2];
          lastResult = await sendFlex(to, flexMsg.altText, flexContents, {
            verbose: false,
            accountId: accountId ?? undefined,
          });
        }
      }

      const sendMediaAfterText = !(hasQuickReplies && chunks.length > 0);
      if (mediaUrls.length > 0 && !shouldSendQuickRepliesInline && !sendMediaAfterText) {
        for (const url of mediaUrls) {
          lastResult = await runtime.channel.line.sendMessageLine(to, "", {
            verbose: false,
            mediaUrl: url,
            accountId: accountId ?? undefined,
          });
        }
      }

      if (chunks.length > 0) {
        for (let i = 0; i < chunks.length; i += 1) {
          const isLast = i === chunks.length - 1;
          if (isLast && hasQuickReplies) {
            lastResult = await sendQuickReplies(to, chunks[i], quickReplies, {
              verbose: false,
              accountId: accountId ?? undefined,
            });
          } else {
            lastResult = await sendText(to, chunks[i], {
              verbose: false,
              accountId: accountId ?? undefined,
            });
          }
        }
      } else if (shouldSendQuickRepliesInline) {
        const quickReplyMessages: Array<Record<string, unknown>> = [];
        if (lineData.flexMessage) {
          quickReplyMessages.push({
            type: "flex",
            altText: lineData.flexMessage.altText.slice(0, 400),
            contents: lineData.flexMessage.contents,
          });
        }
        if (lineData.templateMessage) {
          const template = buildTemplate(lineData.templateMessage);
          if (template) {
            quickReplyMessages.push(template);
          }
        }
        if (lineData.location) {
          quickReplyMessages.push({
            type: "location",
            title: lineData.location.title.slice(0, 100),
            address: lineData.location.address.slice(0, 100),
            latitude: lineData.location.latitude,
            longitude: lineData.location.longitude,
          });
        }
        for (const flexMsg of processed.flexMessages) {
          quickReplyMessages.push({
            type: "flex",
            altText: flexMsg.altText.slice(0, 400),
            contents: flexMsg.contents,
          });
        }
        for (const url of mediaUrls) {
          const trimmed = url?.trim();
          if (!trimmed) {
            continue;
          }
          quickReplyMessages.push({
            type: "image",
            originalContentUrl: trimmed,
            previewImageUrl: trimmed,
          });
        }
        if (quickReplyMessages.length > 0 && quickReply) {
          const lastIndex = quickReplyMessages.length - 1;
          quickReplyMessages[lastIndex] = {
            ...quickReplyMessages[lastIndex],
            quickReply,
          };
          await sendMessageBatch(quickReplyMessages);
        }
      }

      if (mediaUrls.length > 0 && !shouldSendQuickRepliesInline && sendMediaAfterText) {
        for (const url of mediaUrls) {
          lastResult = await runtime.channel.line.sendMessageLine(to, "", {
            verbose: false,
            mediaUrl: url,
            accountId: accountId ?? undefined,
          });
        }
      }

      if (lastResult) {
        return { channel: "line", ...lastResult };
      }
      return { channel: "line", messageId: "empty", chatId: to };
    },
    sendText: async ({ to, text, accountId }) => {
      const runtime = getLineRuntime();
      const sendText = runtime.channel.line.pushMessageLine;
      const sendFlex = runtime.channel.line.pushFlexMessage;

      // Process markdown: extract tables/code blocks, strip formatting
      const processed = processLineMessage(text);

      // Send cleaned text first (if non-empty)
      let result: { messageId: string; chatId: string };
      if (processed.text.trim()) {
        result = await sendText(to, processed.text, {
          verbose: false,
          accountId: accountId ?? undefined,
        });
      } else {
        // If text is empty after processing, still need a result
        result = { messageId: "processed", chatId: to };
      }

      // Send flex messages for tables/code blocks
      for (const flexMsg of processed.flexMessages) {
        // LINE SDK expects FlexContainer but we receive contents as unknown
        const flexContents = flexMsg.contents as Parameters<typeof sendFlex>[2];
        await sendFlex(to, flexMsg.altText, flexContents, {
          verbose: false,
          accountId: accountId ?? undefined,
        });
      }

      return { channel: "line", ...result };
    },
    sendMedia: async ({ to, text, mediaUrl, accountId }) => {
      const send = getLineRuntime().channel.line.sendMessageLine;
      const result = await send(to, text, {
        verbose: false,
        mediaUrl,
        accountId: accountId ?? undefined,
      });
      return { channel: "line", ...result };
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    collectStatusIssues: (accounts) => {
      const issues: ChannelStatusIssue[] = [];
      for (const account of accounts) {
        const accountId = account.accountId ?? DEFAULT_ACCOUNT_ID;
        if (!account.channelAccessToken?.trim()) {
          issues.push({
            channel: "line",
            accountId,
            kind: "config",
            message: "LINE channel access token not configured",
          });
        }
        if (!account.channelSecret?.trim()) {
          issues.push({
            channel: "line",
            accountId,
            kind: "config",
            message: "LINE channel secret not configured",
          });
        }
      }
      return issues;
    },
    buildChannelSummary: ({ snapshot }) => buildTokenChannelStatusSummary(snapshot),
    probeAccount: async ({ account, timeoutMs }) =>
      getLineRuntime().channel.line.probeLineBot(account.channelAccessToken, timeoutMs),
    buildAccountSnapshot: ({ account, runtime, probe }) => {
      const configured = Boolean(
        account.channelAccessToken?.trim() && account.channelSecret?.trim(),
      );
      return {
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured,
        tokenSource: account.tokenSource,
        running: runtime?.running ?? false,
        lastStartAt: runtime?.lastStartAt ?? null,
        lastStopAt: runtime?.lastStopAt ?? null,
        lastError: runtime?.lastError ?? null,
        mode: "webhook",
        probe,
        lastInboundAt: runtime?.lastInboundAt ?? null,
        lastOutboundAt: runtime?.lastOutboundAt ?? null,
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      const token = account.channelAccessToken.trim();
      const secret = account.channelSecret.trim();
      if (!token) {
        throw new Error(
          `LINE webhook mode requires a non-empty channel access token for account "${account.accountId}".`,
        );
      }
      if (!secret) {
        throw new Error(
          `LINE webhook mode requires a non-empty channel secret for account "${account.accountId}".`,
        );
      }

      let lineBotLabel = "";
      try {
        const probe = await getLineRuntime().channel.line.probeLineBot(token, 2500);
        const displayName = probe.ok ? probe.bot?.displayName?.trim() : null;
        if (displayName) {
          lineBotLabel = ` (${displayName})`;
        }
      } catch (err) {
        if (getLineRuntime().logging.shouldLogVerbose()) {
          ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
        }
      }

      ctx.log?.info(`[${account.accountId}] starting LINE provider${lineBotLabel}`);

      return getLineRuntime().channel.line.monitorLineProvider({
        channelAccessToken: token,
        channelSecret: secret,
        accountId: account.accountId,
        config: ctx.cfg,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        webhookPath: account.config.webhookPath,
      });
    },
    logoutAccount: async ({ accountId, cfg }) => {
      const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ?? "";
      const nextCfg = { ...cfg } as OpenClawConfig;
      const lineConfig = (cfg.channels?.line ?? {}) as LineConfig;
      const nextLine = { ...lineConfig };
      let cleared = false;
      let changed = false;

      if (accountId === DEFAULT_ACCOUNT_ID) {
        if (
          nextLine.channelAccessToken ||
          nextLine.channelSecret ||
          nextLine.tokenFile ||
          nextLine.secretFile
        ) {
          delete nextLine.channelAccessToken;
          delete nextLine.channelSecret;
          delete nextLine.tokenFile;
          delete nextLine.secretFile;
          cleared = true;
          changed = true;
        }
      }

      const accounts = nextLine.accounts ? { ...nextLine.accounts } : undefined;
      if (accounts && accountId in accounts) {
        const entry = accounts[accountId];
        if (entry && typeof entry === "object") {
          const nextEntry = { ...entry } as Record<string, unknown>;
          if (
            "channelAccessToken" in nextEntry ||
            "channelSecret" in nextEntry ||
            "tokenFile" in nextEntry ||
            "secretFile" in nextEntry
          ) {
            cleared = true;
            delete nextEntry.channelAccessToken;
            delete nextEntry.channelSecret;
            delete nextEntry.tokenFile;
            delete nextEntry.secretFile;
            changed = true;
          }
          if (Object.keys(nextEntry).length === 0) {
            delete accounts[accountId];
            changed = true;
          } else {
            accounts[accountId] = nextEntry as typeof entry;
          }
        }
      }

      if (accounts) {
        if (Object.keys(accounts).length === 0) {
          delete nextLine.accounts;
          changed = true;
        } else {
          nextLine.accounts = accounts;
        }
      }

      if (changed) {
        if (Object.keys(nextLine).length > 0) {
          nextCfg.channels = { ...nextCfg.channels, line: nextLine };
        } else {
          const nextChannels = { ...nextCfg.channels };
          delete (nextChannels as Record<string, unknown>).line;
          if (Object.keys(nextChannels).length > 0) {
            nextCfg.channels = nextChannels;
          } else {
            delete nextCfg.channels;
          }
        }
        await getLineRuntime().config.writeConfigFile(nextCfg);
      }

      const resolved = getLineRuntime().channel.line.resolveLineAccount({
        cfg: changed ? nextCfg : cfg,
        accountId,
      });
      const loggedOut = resolved.tokenSource === "none";

      return { cleared, envToken: Boolean(envToken), loggedOut };
    },
  },
  agentPrompt: {
    messageToolHints: () => [
      "",
      "### LINE Rich Messages",
      "LINE supports rich visual messages. Use these directives in your reply when appropriate:",
      "",
      "**Quick Replies** (bottom button suggestions):",
      "  [[quick_replies: Option 1, Option 2, Option 3]]",
      "",
      "**Location** (map pin):",
      "  [[location: Place Name | Address | latitude | longitude]]",
      "",
      "**Confirm Dialog** (yes/no prompt):",
      "  [[confirm: Question text? | Yes Label | No Label]]",
      "",
      "**Button Menu** (title + text + buttons):",
      "  [[buttons: Title | Description | Btn1:action1, Btn2:https://url.com]]",
      "",
      "**Media Player Card** (music status):",
      "  [[media_player: Song Title | Artist Name | Source | https://albumart.url | playing]]",
      "  - Status: 'playing' or 'paused' (optional)",
      "",
      "**Event Card** (calendar events, meetings):",
      "  [[event: Event Title | Date | Time | Location | Description]]",
      "  - Time, Location, Description are optional",
      "",
      "**Agenda Card** (multiple events/schedule):",
      "  [[agenda: Schedule Title | Event1:9:00 AM, Event2:12:00 PM, Event3:3:00 PM]]",
      "",
      "**Device Control Card** (smart devices, TVs, etc.):",
      "  [[device: Device Name | Device Type | Status | Control1:data1, Control2:data2]]",
      "",
      "**Apple TV Remote** (full D-pad + transport):",
      "  [[appletv_remote: Apple TV | Playing]]",
      "",
      "**Auto-converted**: Markdown tables become Flex cards, code blocks become styled cards.",
      "",
      "When to use rich messages:",
      "- Use [[quick_replies:...]] when offering 2-4 clear options",
      "- Use [[confirm:...]] for yes/no decisions",
      "- Use [[buttons:...]] for menus with actions/links",
      "- Use [[location:...]] when sharing a place",
      "- Use [[media_player:...]] when showing what's playing",
      "- Use [[event:...]] for calendar event details",
      "- Use [[agenda:...]] for a day's schedule or event list",
      "- Use [[device:...]] for smart device status/controls",
      "- Tables/code in your response auto-convert to visual cards",
    ],
  },
};
```

---

### extensions/line/src/card-command.ts

```typescript
import type { LineChannelData, OpenClawPluginApi, ReplyPayload } from "openclaw/plugin-sdk";
import {
  createActionCard,
  createImageCard,
  createInfoCard,
  createListCard,
  createReceiptCard,
  type CardAction,
  type ListItem,
} from "openclaw/plugin-sdk";

const CARD_USAGE = `Usage: /card <type> "title" "body" [options]

Types:
  info "Title" "Body" ["Footer"]
  image "Title" "Caption" --url <image-url>
  action "Title" "Body" --actions "Btn1|url1,Btn2|text2"
  list "Title" "Item1|Desc1,Item2|Desc2"
  receipt "Title" "Item1:$10,Item2:$20" --total "$30"
  confirm "Question?" --yes "Yes|data" --no "No|data"
  buttons "Title" "Text" --actions "Btn1|url1,Btn2|data2"

Examples:
  /card info "Welcome" "Thanks for joining!"
  /card image "Product" "Check it out" --url https://example.com/img.jpg
  /card action "Menu" "Choose an option" --actions "Order|/order,Help|/help"`;

function buildLineReply(lineData: LineChannelData): ReplyPayload {
  return {
    channelData: {
      line: lineData,
    },
  };
}

/**
 * Parse action string format: "Label|data,Label2|data2"
 * Data can be a URL (uri action) or plain text (message action) or key=value (postback)
 */
function parseActions(actionsStr: string | undefined): CardAction[] {
  if (!actionsStr) {
    return [];
  }

  const results: CardAction[] = [];

  for (const part of actionsStr.split(",")) {
    const [label, data] = part
      .trim()
      .split("|")
      .map((s) => s.trim());
    if (!label) {
      continue;
    }

    const actionData = data || label;

    if (actionData.startsWith("http://") || actionData.startsWith("https://")) {
      results.push({
        label,
        action: { type: "uri", label: label.slice(0, 20), uri: actionData },
      });
    } else if (actionData.includes("=")) {
      results.push({
        label,
        action: {
          type: "postback",
          label: label.slice(0, 20),
          data: actionData.slice(0, 300),
          displayText: label,
        },
      });
    } else {
      results.push({
        label,
        action: { type: "message", label: label.slice(0, 20), text: actionData },
      });
    }
  }

  return results;
}

/**
 * Parse list items format: "Item1|Subtitle1,Item2|Subtitle2"
 */
function parseListItems(itemsStr: string): ListItem[] {
  return itemsStr
    .split(",")
    .map((part) => {
      const [title, subtitle] = part
        .trim()
        .split("|")
        .map((s) => s.trim());
      return { title: title || "", subtitle };
    })
    .filter((item) => item.title);
}

/**
 * Parse receipt items format: "Item1:$10,Item2:$20"
 */
function parseReceiptItems(itemsStr: string): Array<{ name: string; value: string }> {
  return itemsStr
    .split(",")
    .map((part) => {
      const colonIndex = part.lastIndexOf(":");
      if (colonIndex === -1) {
        return { name: part.trim(), value: "" };
      }
      return {
        name: part.slice(0, colonIndex).trim(),
        value: part.slice(colonIndex + 1).trim(),
      };
    })
    .filter((item) => item.name);
}

/**
 * Parse quoted arguments from command string
 * Supports: /card type "arg1" "arg2" "arg3" --flag value
 */
function parseCardArgs(argsStr: string): {
  type: string;
  args: string[];
  flags: Record<string, string>;
} {
  const result: { type: string; args: string[]; flags: Record<string, string> } = {
    type: "",
    args: [],
    flags: {},
  };

  // Extract type (first word)
  const typeMatch = argsStr.match(/^(\w+)/);
  if (typeMatch) {
    result.type = typeMatch[1].toLowerCase();
    argsStr = argsStr.slice(typeMatch[0].length).trim();
  }

  // Extract quoted arguments
  const quotedRegex = /"([^"]*?)"/g;
  let match;
  while ((match = quotedRegex.exec(argsStr)) !== null) {
    result.args.push(match[1]);
  }

  // Extract flags (--key value or --key "value")
  const flagRegex = /--(\w+)\s+(?:"([^"]*?)"|(\S+))/g;
  while ((match = flagRegex.exec(argsStr)) !== null) {
    result.flags[match[1]] = match[2] ?? match[3];
  }

  return result;
}

export function registerLineCardCommand(api: OpenClawPluginApi): void {
  api.registerCommand({
    name: "card",
    description: "Send a rich card message (LINE).",
    acceptsArgs: true,
    requireAuth: false,
    handler: async (ctx) => {
      const argsStr = ctx.args?.trim() ?? "";
      if (!argsStr) {
        return { text: CARD_USAGE };
      }

      const parsed = parseCardArgs(argsStr);
      const { type, args, flags } = parsed;

      if (!type) {
        return { text: CARD_USAGE };
      }

      // Only LINE supports rich cards; fallback to text elsewhere.
      if (ctx.channel !== "line") {
        const fallbackText = args.join(" - ");
        return { text: `[${type} card] ${fallbackText}`.trim() };
      }

      try {
        switch (type) {
          case "info": {
            const [title = "Info", body = "", footer] = args;
            const bubble = createInfoCard(title, body, footer);
            return buildLineReply({
              flexMessage: {
                altText: `${title}: ${body}`.slice(0, 400),
                contents: bubble,
              },
            });
          }

          case "image": {
            const [title = "Image", caption = ""] = args;
            const imageUrl = flags.url || flags.image;
            if (!imageUrl) {
              return { text: "Error: Image card requires --url <image-url>" };
            }
            const bubble = createImageCard(imageUrl, title, caption);
            return buildLineReply({
              flexMessage: {
                altText: `${title}: ${caption}`.slice(0, 400),
                contents: bubble,
              },
            });
          }

          case "action": {
            const [title = "Actions", body = ""] = args;
            const actions = parseActions(flags.actions);
            if (actions.length === 0) {
              return { text: 'Error: Action card requires --actions "Label1|data1,Label2|data2"' };
            }
            const bubble = createActionCard(title, body, actions, {
              imageUrl: flags.url || flags.image,
            });
            return buildLineReply({
              flexMessage: {
                altText: `${title}: ${body}`.slice(0, 400),
                contents: bubble,
              },
            });
          }

          case "list": {
            const [title = "List", itemsStr = ""] = args;
            const items = parseListItems(itemsStr || flags.items || "");
            if (items.length === 0) {
              return {
                text: 'Error: List card requires items. Usage: /card list "Title" "Item1|Desc1,Item2|Desc2"',
              };
            }
            const bubble = createListCard(title, items);
            return buildLineReply({
              flexMessage: {
                altText: `${title}: ${items.map((i) => i.title).join(", ")}`.slice(0, 400),
                contents: bubble,
              },
            });
          }

          case "receipt": {
            const [title = "Receipt", itemsStr = ""] = args;
            const items = parseReceiptItems(itemsStr || flags.items || "");
            const total = flags.total ? { label: "Total", value: flags.total } : undefined;
            const footer = flags.footer;

            if (items.length === 0) {
              return {
                text: 'Error: Receipt card requires items. Usage: /card receipt "Title" "Item1:$10,Item2:$20" --total "$30"',
              };
            }

            const bubble = createReceiptCard({ title, items, total, footer });
            return buildLineReply({
              flexMessage: {
                altText: `${title}: ${items.map((i) => `${i.name} ${i.value}`).join(", ")}`.slice(
                  0,
                  400,
                ),
                contents: bubble,
              },
            });
          }

          case "confirm": {
            const [question = "Confirm?"] = args;
            const yesStr = flags.yes || "Yes|yes";
            const noStr = flags.no || "No|no";

            const [yesLabel, yesData] = yesStr.split("|").map((s) => s.trim());
            const [noLabel, noData] = noStr.split("|").map((s) => s.trim());

            return buildLineReply({
              templateMessage: {
                type: "confirm",
                text: question,
                confirmLabel: yesLabel || "Yes",
                confirmData: yesData || "yes",
                cancelLabel: noLabel || "No",
                cancelData: noData || "no",
                altText: question,
              },
            });
          }

          case "buttons": {
            const [title = "Menu", text = "Choose an option"] = args;
            const actionsStr = flags.actions || "";
            const actionParts = parseActions(actionsStr);

            if (actionParts.length === 0) {
              return { text: 'Error: Buttons card requires --actions "Label1|data1,Label2|data2"' };
            }

            const templateActions: Array<{
              type: "message" | "uri" | "postback";
              label: string;
              data?: string;
              uri?: string;
            }> = actionParts.map((a) => {
              const action = a.action;
              const label = action.label ?? a.label;
              if (action.type === "uri") {
                return { type: "uri" as const, label, uri: (action as { uri: string }).uri };
              }
              if (action.type === "postback") {
                return {
                  type: "postback" as const,
                  label,
                  data: (action as { data: string }).data,
                };
              }
              return {
                type: "message" as const,
                label,
                data: (action as { text: string }).text,
              };
            });

            return buildLineReply({
              templateMessage: {
                type: "buttons",
                title,
                text,
                thumbnailImageUrl: flags.url || flags.image,
                actions: templateActions,
              },
            });
          }

          default:
            return {
              text: `Unknown card type: "${type}". Available types: info, image, action, list, receipt, confirm, buttons`,
            };
        }
      } catch (err) {
        return { text: `Error creating card: ${String(err)}` };
      }
    },
  });
}
```

---

### Comparison: extensions/zalo/index.ts

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { zaloDock, zaloPlugin } from "./src/channel.js";
import { handleZaloWebhookRequest } from "./src/monitor.js";
import { setZaloRuntime } from "./src/runtime.js";

const plugin = {
  id: "zalo",
  name: "Zalo",
  description: "Zalo channel plugin (Bot API)",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setZaloRuntime(api.runtime);
    api.registerChannel({ plugin: zaloPlugin, dock: zaloDock });
    api.registerHttpHandler(handleZaloWebhookRequest);
  },
};

export default plugin;
```

**Differences vs LINE:**
- Zalo registers a `dock` (second argument to `registerChannel`) — LINE does not use a dock
- Zalo registers an HTTP handler directly (`api.registerHttpHandler`) for its webhook — LINE's webhook is handled through `monitorLineProvider` within `gateway.startAccount`
- Zalo also has a `monitor.js` exporting `handleZaloWebhookRequest`

---

### Comparison: extensions/matrix/index.ts

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { matrixPlugin } from "./src/channel.js";
import { setMatrixRuntime } from "./src/runtime.js";

const plugin = {
  id: "matrix",
  name: "Matrix",
  description: "Matrix channel plugin (matrix-js-sdk)",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setMatrixRuntime(api.runtime);
    api.registerChannel({ plugin: matrixPlugin });
  },
};

export default plugin;
```

**Differences vs LINE:**
- Matrix does NOT register a card command (no `registerCommand` call)
- Matrix does NOT register an HTTP handler
- Matrix is the simplest pattern: runtime singleton + channel registration only
- LINE adds `registerLineCardCommand(api)` as a third registration step

---

## PLUGIN SDK INTERFACE

Source: `https://raw.githubusercontent.com/openclaw/openclaw/main/src/plugins/types.ts`

This file is the authoritative definition of `OpenClawPluginApi` (the `api` object passed to every plugin's `register()` method) and all related hook/command types.

### src/plugins/types.ts (OpenClawPluginApi and command types)

```typescript
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Command } from "commander";
import type { AuthProfileCredential, OAuthCredential } from "../agents/auth-profiles/types.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import type { ReplyPayload } from "../auto-reply/types.js";
import type { ChannelDock } from "../channels/dock.js";
import type { ChannelId, ChannelPlugin } from "../channels/plugins/types.js";
import type { createVpsAwareOAuthHandlers } from "../commands/oauth-flow.js";
import type { OpenClawConfig } from "../config/config.js";
import type { ModelProviderConfig } from "../config/types.js";
import type { GatewayRequestHandler } from "../gateway/server-methods/types.js";
import type { InternalHookHandler } from "../hooks/internal-hooks.js";
import type { HookEntry } from "../hooks/types.js";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import type { PluginRuntime } from "./runtime/types.js";

export type { PluginRuntime } from "./runtime/types.js";
export type { AnyAgentTool } from "../agents/tools/common.js";

export type PluginLogger = {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type PluginConfigUiHint = {
  label?: string;
  help?: string;
  tags?: string[];
  advanced?: boolean;
  sensitive?: boolean;
  placeholder?: string;
};

export type PluginKind = "memory";

export type PluginConfigValidation =
  | { ok: true; value?: unknown }
  | { ok: false; errors: string[] };

export type OpenClawPluginConfigSchema = {
  safeParse?: (value: unknown) => {
    success: boolean;
    data?: unknown;
    error?: {
      issues?: Array<{ path: Array<string | number>; message: string }>;
    };
  };
  parse?: (value: unknown) => unknown;
  validate?: (value: unknown) => PluginConfigValidation;
  uiHints?: Record<string, PluginConfigUiHint>;
  jsonSchema?: Record<string, unknown>;
};

export type OpenClawPluginToolContext = {
  config?: OpenClawConfig;
  workspaceDir?: string;
  agentDir?: string;
  agentId?: string;
  sessionKey?: string;
  messageChannel?: string;
  agentAccountId?: string;
  sandboxed?: boolean;
};

export type OpenClawPluginToolFactory = (
  ctx: OpenClawPluginToolContext,
) => AnyAgentTool | AnyAgentTool[] | null | undefined;

export type OpenClawPluginToolOptions = {
  name?: string;
  names?: string[];
  optional?: boolean;
};

export type OpenClawPluginHookOptions = {
  entry?: HookEntry;
  name?: string;
  description?: string;
  register?: boolean;
};

export type ProviderAuthKind = "oauth" | "api_key" | "token" | "device_code" | "custom";

export type ProviderAuthResult = {
  profiles: Array<{ profileId: string; credential: AuthProfileCredential }>;
  configPatch?: Partial<OpenClawConfig>;
  defaultModel?: string;
  notes?: string[];
};

export type ProviderAuthContext = {
  config: OpenClawConfig;
  agentDir?: string;
  workspaceDir?: string;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  isRemote: boolean;
  openUrl: (url: string) => Promise<void>;
  oauth: {
    createVpsAwareHandlers: typeof createVpsAwareOAuthHandlers;
  };
};

export type ProviderAuthMethod = {
  id: string;
  label: string;
  hint?: string;
  kind: ProviderAuthKind;
  run: (ctx: ProviderAuthContext) => Promise<ProviderAuthResult>;
};

export type ProviderPlugin = {
  id: string;
  label: string;
  docsPath?: string;
  aliases?: string[];
  envVars?: string[];
  models?: ModelProviderConfig;
  auth: ProviderAuthMethod[];
  formatApiKey?: (cred: AuthProfileCredential) => string;
  refreshOAuth?: (cred: OAuthCredential) => Promise<OAuthCredential>;
};

export type OpenClawPluginGatewayMethod = {
  method: string;
  handler: GatewayRequestHandler;
};

// =============================================================================
// Plugin Commands
// =============================================================================

/**
 * Context passed to plugin command handlers.
 */
export type PluginCommandContext = {
  /** The sender's identifier (e.g., Telegram user ID) */
  senderId?: string;
  /** The channel/surface (e.g., "telegram", "discord") */
  channel: string;
  /** Provider channel id (e.g., "telegram") */
  channelId?: ChannelId;
  /** Whether the sender is on the allowlist */
  isAuthorizedSender: boolean;
  /** Raw command arguments after the command name */
  args?: string;
  /** The full normalized command body */
  commandBody: string;
  /** Current OpenClaw configuration */
  config: OpenClawConfig;
  /** Raw "From" value (channel-scoped id) */
  from?: string;
  /** Raw "To" value (channel-scoped id) */
  to?: string;
  /** Account id for multi-account channels */
  accountId?: string;
  /** Thread/topic id if available */
  messageThreadId?: number;
};

/**
 * Result returned by a plugin command handler.
 */
export type PluginCommandResult = ReplyPayload;

/**
 * Handler function for plugin commands.
 */
export type PluginCommandHandler = (
  ctx: PluginCommandContext,
) => PluginCommandResult | Promise<PluginCommandResult>;

/**
 * Definition for a plugin-registered command.
 */
export type OpenClawPluginCommandDefinition = {
  /** Command name without leading slash (e.g., "tts") */
  name: string;
  /** Description shown in /help and command menus */
  description: string;
  /** Whether this command accepts arguments */
  acceptsArgs?: boolean;
  /** Whether only authorized senders can use this command (default: true) */
  requireAuth?: boolean;
  /** The handler function */
  handler: PluginCommandHandler;
};

export type OpenClawPluginHttpHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<boolean> | boolean;

export type OpenClawPluginHttpRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void> | void;

export type OpenClawPluginCliContext = {
  program: Command;
  config: OpenClawConfig;
  workspaceDir?: string;
  logger: PluginLogger;
};

export type OpenClawPluginCliRegistrar = (ctx: OpenClawPluginCliContext) => void | Promise<void>;

export type OpenClawPluginServiceContext = {
  config: OpenClawConfig;
  workspaceDir?: string;
  stateDir: string;
  logger: PluginLogger;
};

export type OpenClawPluginService = {
  id: string;
  start: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
  stop?: (ctx: OpenClawPluginServiceContext) => void | Promise<void>;
};

export type OpenClawPluginChannelRegistration = {
  plugin: ChannelPlugin;
  dock?: ChannelDock;
};

export type OpenClawPluginDefinition = {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  kind?: PluginKind;
  configSchema?: OpenClawPluginConfigSchema;
  register?: (api: OpenClawPluginApi) => void | Promise<void>;
  activate?: (api: OpenClawPluginApi) => void | Promise<void>;
};

export type OpenClawPluginModule =
  | OpenClawPluginDefinition
  | ((api: OpenClawPluginApi) => void | Promise<void>);

export type OpenClawPluginApi = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  config: OpenClawConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  registerTool: (
    tool: AnyAgentTool | OpenClawPluginToolFactory,
    opts?: OpenClawPluginToolOptions,
  ) => void;
  registerHook: (
    events: string | string[],
    handler: InternalHookHandler,
    opts?: OpenClawPluginHookOptions,
  ) => void;
  registerHttpHandler: (handler: OpenClawPluginHttpHandler) => void;
  registerHttpRoute: (params: { path: string; handler: OpenClawPluginHttpRouteHandler }) => void;
  registerChannel: (registration: OpenClawPluginChannelRegistration | ChannelPlugin) => void;
  registerGatewayMethod: (method: string, handler: GatewayRequestHandler) => void;
  registerCli: (registrar: OpenClawPluginCliRegistrar, opts?: { commands?: string[] }) => void;
  registerService: (service: OpenClawPluginService) => void;
  registerProvider: (provider: ProviderPlugin) => void;
  /**
   * Register a custom command that bypasses the LLM agent.
   * Plugin commands are processed before built-in commands and before agent invocation.
   * Use this for simple state-toggling or status commands that don't need AI reasoning.
   */
  registerCommand: (command: OpenClawPluginCommandDefinition) => void;
  resolvePath: (input: string) => string;
  /** Register a lifecycle hook handler */
  on: <K extends PluginHookName>(
    hookName: K,
    handler: PluginHookHandlerMap[K],
    opts?: { priority?: number },
  ) => void;
};

export type PluginOrigin = "bundled" | "global" | "workspace" | "config";

export type PluginDiagnostic = {
  level: "warn" | "error";
  message: string;
  pluginId?: string;
  source?: string;
};

// ============================================================================
// Plugin Hooks
// ============================================================================

export type PluginHookName =
  | "before_model_resolve"
  | "before_prompt_build"
  | "before_agent_start"
  | "llm_input"
  | "llm_output"
  | "agent_end"
  | "before_compaction"
  | "after_compaction"
  | "before_reset"
  | "message_received"
  | "message_sending"
  | "message_sent"
  | "before_tool_call"
  | "after_tool_call"
  | "tool_result_persist"
  | "before_message_write"
  | "session_start"
  | "session_end"
  | "subagent_spawning"
  | "subagent_delivery_target"
  | "subagent_spawned"
  | "subagent_ended"
  | "gateway_start"
  | "gateway_stop";

// ... (full hook type definitions follow — see raw file for complete listing)
// Hook handler types mapped by hook name
export type PluginHookHandlerMap = {
  before_model_resolve: (event, ctx) => Promise<result | void> | result | void;
  before_prompt_build: (event, ctx) => Promise<result | void> | result | void;
  before_agent_start: (event, ctx) => Promise<result | void> | result | void;
  llm_input: (event, ctx) => Promise<void> | void;
  llm_output: (event, ctx) => Promise<void> | void;
  agent_end: (event, ctx) => Promise<void> | void;
  before_compaction: (event, ctx) => Promise<void> | void;
  after_compaction: (event, ctx) => Promise<void> | void;
  before_reset: (event, ctx) => Promise<void> | void;
  message_received: (event, ctx) => Promise<void> | void;
  message_sending: (event, ctx) => Promise<result | void> | result | void;
  message_sent: (event, ctx) => Promise<void> | void;
  before_tool_call: (event, ctx) => Promise<result | void> | result | void;
  after_tool_call: (event, ctx) => Promise<void> | void;
  tool_result_persist: (event, ctx) => result | void;
  before_message_write: (event, ctx) => result | void;
  session_start: (event, ctx) => Promise<void> | void;
  session_end: (event, ctx) => Promise<void> | void;
  subagent_spawning: (event, ctx) => Promise<result | void> | result | void;
  subagent_delivery_target: (event, ctx) => Promise<result | void> | result | void;
  subagent_spawned: (event, ctx) => Promise<void> | void;
  subagent_ended: (event, ctx) => Promise<void> | void;
  gateway_start: (event, ctx) => Promise<void> | void;
  gateway_stop: (event, ctx) => Promise<void> | void;
};
```

---

### src/plugins/runtime/types.ts (PluginRuntime)

Source: `https://raw.githubusercontent.com/openclaw/openclaw/main/src/plugins/runtime/types.ts`

This defines the `PluginRuntime` type — the object stored by `setLineRuntime(api.runtime)` and retrieved by `getLineRuntime()`.

**Key sections of PluginRuntime relevant to the LINE plugin:**

```typescript
export type PluginRuntime = {
  version: string;
  config: {
    loadConfig: LoadConfig;
    writeConfigFile: WriteConfigFile;
  };
  system: {
    enqueueSystemEvent: EnqueueSystemEvent;
    runCommandWithTimeout: RunCommandWithTimeout;
    formatNativeDependencyHint: FormatNativeDependencyHint;
  };
  media: {
    loadWebMedia: LoadWebMedia;
    detectMime: DetectMime;
    mediaKindFromMime: MediaKindFromMime;
    isVoiceCompatibleAudio: IsVoiceCompatibleAudio;
    getImageMetadata: GetImageMetadata;
    resizeToJpeg: ResizeToJpeg;
  };
  tts: {
    textToSpeechTelephony: TextToSpeechTelephony;
  };
  tools: {
    createMemoryGetTool: CreateMemoryGetTool;
    createMemorySearchTool: CreateMemorySearchTool;
    registerMemoryCli: RegisterMemoryCli;
  };
  channel: {
    text: {
      chunkByNewline: ChunkByNewline;
      chunkMarkdownText: ChunkMarkdownText;
      chunkMarkdownTextWithMode: ChunkMarkdownTextWithMode;
      chunkText: ChunkText;
      chunkTextWithMode: ChunkTextWithMode;
      resolveChunkMode: ResolveChunkMode;
      resolveTextChunkLimit: ResolveTextChunkLimit;
      hasControlCommand: HasControlCommand;
      resolveMarkdownTableMode: ResolveMarkdownTableMode;
      convertMarkdownTables: ConvertMarkdownTables;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher: DispatchReplyWithBufferedBlockDispatcher;
      createReplyDispatcherWithTyping: CreateReplyDispatcherWithTyping;
      resolveEffectiveMessagesConfig: ResolveEffectiveMessagesConfig;
      resolveHumanDelayConfig: ResolveHumanDelayConfig;
      dispatchReplyFromConfig: DispatchReplyFromConfig;
      finalizeInboundContext: FinalizeInboundContext;
      formatAgentEnvelope: FormatAgentEnvelope;
      formatInboundEnvelope: FormatInboundEnvelope;  // @deprecated
      resolveEnvelopeFormatOptions: ResolveEnvelopeFormatOptions;
    };
    routing: {
      resolveAgentRoute: ResolveAgentRoute;
    };
    pairing: {
      buildPairingReply: BuildPairingReply;
      readAllowFromStore: ReadChannelAllowFromStore;
      upsertPairingRequest: UpsertChannelPairingRequest;
    };
    media: {
      fetchRemoteMedia: FetchRemoteMedia;
      saveMediaBuffer: SaveMediaBuffer;
    };
    activity: {
      record: RecordChannelActivity;
      get: GetChannelActivity;
    };
    session: {
      resolveStorePath: ResolveStorePath;
      readSessionUpdatedAt: ReadSessionUpdatedAt;
      recordSessionMetaFromInbound: RecordSessionMetaFromInbound;
      recordInboundSession: RecordInboundSession;
      updateLastRoute: UpdateLastRoute;
    };
    mentions: {
      buildMentionRegexes: BuildMentionRegexes;
      matchesMentionPatterns: MatchesMentionPatterns;
      matchesMentionWithExplicit: MatchesMentionWithExplicit;
    };
    reactions: {
      shouldAckReaction: ShouldAckReaction;
      removeAckReactionAfterReply: RemoveAckReactionAfterReply;
    };
    groups: {
      resolveGroupPolicy: ResolveChannelGroupPolicy;
      resolveRequireMention: ResolveChannelGroupRequireMention;
    };
    debounce: {
      createInboundDebouncer: CreateInboundDebouncer;
      resolveInboundDebounceMs: ResolveInboundDebounceMs;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers: ResolveCommandAuthorizedFromAuthorizers;
      isControlCommandMessage: IsControlCommandMessage;
      shouldComputeCommandAuthorized: ShouldComputeCommandAuthorized;
      shouldHandleTextCommands: ShouldHandleTextCommands;
    };
    // ... discord, slack, telegram, signal, imessage, whatsapp sections ...
    line: {
      listLineAccountIds: ListLineAccountIds;
      resolveDefaultLineAccountId: ResolveDefaultLineAccountId;
      resolveLineAccount: ResolveLineAccount;
      normalizeAccountId: NormalizeLineAccountId;
      probeLineBot: ProbeLineBot;
      sendMessageLine: SendMessageLine;
      pushMessageLine: PushMessageLine;
      pushMessagesLine: PushMessagesLine;
      pushFlexMessage: PushFlexMessage;
      pushTemplateMessage: PushTemplateMessage;
      pushLocationMessage: PushLocationMessage;
      pushTextMessageWithQuickReplies: PushTextMessageWithQuickReplies;
      createQuickReplyItems: CreateQuickReplyItems;
      buildTemplateMessageFromPayload: BuildTemplateMessageFromPayload;
      monitorLineProvider: MonitorLineProvider;
    };
  };
  logging: {
    shouldLogVerbose: ShouldLogVerbose;
    getChildLogger: (
      bindings?: Record<string, unknown>,
      opts?: { level?: LogLevel },
    ) => RuntimeLogger;
  };
  state: {
    resolveStateDir: ResolveStateDir;
  };
};
```

**Key observation:** The `PluginRuntime` type is the plugin-facing API surface for ALL channel internals. The LINE plugin does NOT depend on `@line/bot-sdk` or any LINE-specific package directly — all LINE API calls (`pushMessageLine`, `pushFlexMessage`, `monitorLineProvider`, etc.) are accessed through `runtime.channel.line.*`. These are implemented in `src/line/` inside the core monorepo and injected into the runtime at startup. This means the external LINE plugin (in `extensions/line/`) has zero direct dependency on the LINE SDK.

---

### src/channels/plugins/types.plugin.ts (ChannelPlugin)

Source: `https://raw.githubusercontent.com/openclaw/openclaw/main/src/channels/plugins/types.plugin.ts`

```typescript
// oxlint-disable-next-line typescript/no-explicit-any
export type ChannelPlugin<ResolvedAccount = any, Probe = unknown, Audit = unknown> = {
  id: ChannelId;
  meta: ChannelMeta;
  capabilities: ChannelCapabilities;
  defaults?: {
    queue?: {
      debounceMs?: number;
    };
  };
  reload?: { configPrefixes: string[]; noopPrefixes?: string[] };
  // CLI onboarding wizard hooks for this channel.
  onboarding?: ChannelOnboardingAdapter;
  config: ChannelConfigAdapter<ResolvedAccount>;
  configSchema?: ChannelConfigSchema;
  setup?: ChannelSetupAdapter;
  pairing?: ChannelPairingAdapter;
  security?: ChannelSecurityAdapter<ResolvedAccount>;
  groups?: ChannelGroupAdapter;
  mentions?: ChannelMentionAdapter;
  outbound?: ChannelOutboundAdapter;
  status?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>;
  gatewayMethods?: string[];
  gateway?: ChannelGatewayAdapter<ResolvedAccount>;
  auth?: ChannelAuthAdapter;
  elevated?: ChannelElevatedAdapter;
  commands?: ChannelCommandAdapter;
  streaming?: ChannelStreamingAdapter;
  threading?: ChannelThreadingAdapter;
  messaging?: ChannelMessagingAdapter;
  agentPrompt?: ChannelAgentPromptAdapter;
  directory?: ChannelDirectoryAdapter;
  resolver?: ChannelResolverAdapter;
  actions?: ChannelMessageActionAdapter;
  heartbeat?: ChannelHeartbeatAdapter;
  // Channel-owned agent tools (login flows, etc.).
  agentTools?: ChannelAgentToolFactory | ChannelAgentTool[];
};
```

**Adapters implemented by the LINE plugin:**

| Adapter | LINE implements? |
|---------|----------------|
| `config` | YES (required) |
| `capabilities` | YES (required) |
| `meta` | YES (required) |
| `pairing` | YES |
| `security` | YES |
| `groups` | YES |
| `messaging` | YES |
| `directory` | YES (stubs — returns null/empty) |
| `setup` | YES |
| `outbound` | YES (sendPayload, sendText, sendMedia) |
| `status` | YES |
| `gateway` | YES (startAccount, logoutAccount) |
| `agentPrompt` | YES (rich message hints) |
| `reload` | YES (configPrefixes: ["channels.line"]) |
| `configSchema` | YES (buildChannelConfigSchema(LineConfigSchema)) |
| `auth` | NO |
| `elevated` | NO |
| `commands` | NO |
| `streaming` | NO (blockStreaming: true in capabilities) |
| `threading` | NO |
| `mentions` | NO |
| `resolver` | NO |
| `actions` | NO |
| `heartbeat` | NO |
| `onboarding` | NO |
| `agentTools` | NO |

---

## STANDALONE PLUGIN FEASIBILITY

### 1. Public Plugin SDK — Does One Exist?

**`@openclaw/plugin-sdk` on npm:** Returns HTTP 404. This scoped package does not exist.

**`openclaw-plugin-sdk` on npm:** Returns HTTP 404. This unscoped package does not exist.

**The actual SDK location:** The plugin SDK is shipped as a **subpath export of the main `openclaw` package**:

```json
// openclaw package.json exports (abbreviated)
{
  "./plugin-sdk": {
    "types": "./dist/plugin-sdk/index.d.ts",
    "default": "./dist/plugin-sdk/index.js"
  },
  "./plugin-sdk/account-id": {
    "types": "./dist/plugin-sdk/account-id.d.ts",
    "default": "./dist/plugin-sdk/account-id.js"
  }
}
```

Plugins import it as:

```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
```

The `openclaw` package is publicly available on npm (latest: `2026.2.24`, maintained by `steipete`). The SDK subpath is a stable, documented public export.

---

### 2. How Published Standalone Extensions Work

Both `@openclaw/zalo` and `@openclaw/matrix` are publicly published to npm under the `@openclaw` scope.

**`@openclaw/zalo` (npm verified — 17 published versions):**
- `dependencies`: only `undici` (HTTP client) — no internal monorepo packages
- Imports: `import type { OpenClawPluginApi } from "openclaw/plugin-sdk"` and `import { emptyPluginConfigSchema } from "openclaw/plugin-sdk"`
- API calls to Zalo: **direct HTTP via `undici`** (resolves a proxy-aware fetch instance, calls Zalo Bot API endpoints directly)
- No dependency on internal runtime methods for outbound calls — Zalo has no `PluginRuntime.channel.zalo.*` namespace

**`@openclaw/matrix` (npm verified — 18 published versions):**
- `dependencies`: `@matrix-org/matrix-sdk-crypto-nodejs`, `@vector-im/matrix-bot-sdk`, `markdown-it`, `music-metadata`, `zod`
- Imports: same pattern — `openclaw/plugin-sdk` for SDK types/helpers, own third-party SDKs for the protocol
- No internal monorepo package dependencies

**The pattern:** Each standalone plugin owns its outbound API logic entirely. The `openclaw/plugin-sdk` dependency is the **only bridge to the host**, and it is publicly available.

---

### 3. Does the LINE Plugin Use Internal-Only APIs?

This is the critical question. The answer is **YES — but they are exposed via the public SDK**.

**`extensions/line/src/runtime.ts`:**

```typescript
import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setLineRuntime(r: PluginRuntime): void {
  runtime = r;
}
export function getLineRuntime(): PluginRuntime {
  if (!runtime) throw new Error("LINE runtime not initialized");
  return runtime;
}
```

The LINE plugin calls `getLineRuntime().channel.line.*` for all outbound messaging. The `PluginRuntime` type is exported from `openclaw/plugin-sdk` and exposes a `channel.line` namespace with the following methods:

| Method | Purpose |
|--------|---------|
| `listLineAccountIds` | List configured LINE accounts |
| `resolveDefaultLineAccountId` | Resolve default account |
| `resolveLineAccount` | Resolve account by ID |
| `normalizeAccountId` | Normalize LINE account ID format |
| `probeLineBot` | Probe LINE bot status |
| `sendMessageLine` | Send reply message |
| `pushMessageLine` | Push single message |
| `pushMessagesLine` | Push multiple messages |
| `pushFlexMessage` | Push Flex Message (rich card) |
| `pushTemplateMessage` | Push template message |
| `pushLocationMessage` | Push location message |
| `pushTextMessageWithQuickReplies` | Push text with quick reply buttons |
| `createQuickReplyItems` | Build quick reply item array |
| `buildTemplateMessageFromPayload` | Build template from payload |
| `monitorLineProvider` | Monitor LINE provider health |

**Critical distinction vs Zalo:** Zalo makes direct HTTP calls to its upstream API using `undici`. LINE does NOT — it delegates entirely through `PluginRuntime.channel.line.*`. This means the LINE plugin **requires the host runtime to have LINE channel support built in** before the plugin's outbound calls can work.

The LINE plugin also exports LINE-specific helpers from the SDK itself:
```typescript
// From openclaw/plugin-sdk index.ts:
export { listLineAccountIds, normalizeLineAccountId, resolveDefaultLineAccountId, resolveLineAccount } from "../line/accounts.js";
export { LineConfigSchema } from "../line/config-schema.js";
export { createInfoCard, createListCard, createImageCard, createActionCard, createReceiptCard, ... } from "../line/flex-templates.js";
export { processLineMessage, hasMarkdownToConvert, stripMarkdown } from "../line/markdown-to-line.js";
```

These are public SDK utilities (schemas, flex card builders, markdown converters) that a standalone plugin can freely use.

---

### 4. Plugin Manifest and External Plugin Documentation

**From `docs/plugins/manifest.md`:**
- Every plugin must include an `openclaw.plugin.json` manifest (or the equivalent `openclaw` key in `package.json`)
- Required fields: `id` (string) and `configSchema` (JSON Schema object)
- Optional: `kind`, `channels`, `providers`, `skills`, `name`, `description`, `uiHints`, `version`
- An empty config schema `{ "type": "object", "additionalProperties": false }` is valid

**From `docs/tools/plugin.md`:**
- Plugins should be packaged as **separate npm modules** under the `@openclaw/*` namespace (but this is guidance, not enforcement)
- `package.json` must include an `openclaw.extensions` field listing entry files
- Entry files can be TypeScript or JavaScript (loaded at runtime via `jiti`)
- Installation: `openclaw plugins install <npm-spec>` — uses `npm pack`, extracts to `~/.openclaw/extensions/<id>/`
- Scoped packages are **normalized to unscoped id** for `plugins.entries.*` keys (e.g., `@openclaw/line` → `line`)
- Plugins run **in-process** with the Gateway and are treated as trusted code
- External plugin catalogs supported via `~/.openclaw/mpm/plugins.json` or environment variable

**Key takeaway:** The documentation explicitly describes publishing plugins to npm, including under the `@openclaw/*` namespace. The install toolchain is built for external npm packages.

---

### 5. npm Name Availability and Scope Access

**`@openclaw/line` on npm:** Returns HTTP 404 — **the name is not taken**. The package does not exist on npm.

**`@openclaw` scope ownership:** The scope is controlled by the same entity (`steipete`) that publishes `@openclaw/zalo` and `@openclaw/matrix`. npm scopes are **owner-restricted** — only the scope owner (or users granted access by the owner) can publish under `@openclaw/*`. Third parties cannot publish under this scope without explicit permission from `steipete` / the OpenClaw organization.

**Is it realistic to get scope access?** The `@openclaw/line` package is listed in the official monorepo `extensions/line/package.json` with `"private": true` and an `install.npmSpec` of `"@openclaw/line"`. This confirms the upstream project intends to publish it themselves. The slot is reserved in intent, just not yet published.

**Alternative npm names (if scope access is unavailable):**

| Name | Notes |
|------|-------|
| `openclaw-line` | Unscoped, simple, follows `openclaw-*` convention |
| `openclaw-plugin-line` | Explicit, descriptive |
| `openclaw-channel-line` | Clarifies it is a channel plugin |
| `@your-org/openclaw-line` | Under your own npm org scope |
| `openclaw-line-plugin` | Alternate word order |

Any of the unscoped names or an own-scope name are immediately publishable without requiring upstream permission.

---

### Summary: Can We Build and Publish a Standalone LINE Plugin for OpenClaw to npm?

**CONDITIONAL YES**

**What works:**
1. The `openclaw/plugin-sdk` is a public npm subpath export — no private SDK is needed
2. The plugin manifest/extension format is fully documented for external use
3. The `openclaw plugins install <npm-spec>` toolchain is designed to load third-party npm packages
4. LINE-specific SDK utilities (`LineConfigSchema`, flex card builders, markdown converters, account helpers) are all exported from `openclaw/plugin-sdk`
5. The `@openclaw/line` name is not yet taken on npm (404)

**The hard blocker:**
The LINE plugin's outbound message dispatch (every `send*` and `push*` call) routes through `PluginRuntime.channel.line.*` — methods that **only exist if the host `openclaw` runtime already has LINE channel support compiled in**. Unlike Zalo (which owns its full HTTP stack via `undici`), a standalone LINE plugin cannot send a single message without the runtime providing `channel.line.*`.

This means:
- A standalone plugin **can register itself, parse webhooks, and handle configuration** entirely
- A standalone plugin **cannot send outbound messages** unless run against a version of `openclaw` that already includes `PluginRuntime.channel.line` — which the public `openclaw` npm package does expose (since `PluginRuntime` type and the runtime implementation are inside the core package)

**Scope publishing constraint:**
Publishing as `@openclaw/line` requires access to the `@openclaw` npm scope, which is controlled by the upstream maintainer. Without that access, the plugin must be published under a different name (e.g., `openclaw-line` or `@your-org/openclaw-line`). The plugin would still function identically — `openclaw plugins install openclaw-line` works the same as installing from `@openclaw/line`.

**Verdict:**

| Criterion | Status |
|-----------|--------|
| Public SDK available | YES — `openclaw/plugin-sdk` subpath |
| Plugin format documented for external use | YES |
| npm install toolchain supports third-party packages | YES |
| Outbound API calls require host runtime support | YES — `channel.line.*` must be in host `openclaw` |
| Host `openclaw` package includes LINE runtime | YES — `channel.line` is in published `openclaw` |
| Can publish as `@openclaw/line` | CONDITIONAL — requires upstream scope permission |
| Alternative names available | YES — `openclaw-line`, `openclaw-plugin-line`, etc. |

**Bottom line:** A standalone LINE channel plugin for OpenClaw is technically feasible and can be published to npm. The plugin would depend on `openclaw` (peer dependency) and work identically to the official `@openclaw/zalo` and `@openclaw/matrix` plugins in structure. The only real constraint is the `@openclaw` npm scope — publish under `openclaw-line` or your own scope if upstream access is unavailable.
