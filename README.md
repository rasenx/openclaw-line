# @rasenx/openclaw-line

LINE Messaging API channel plugin for [OpenClaw](https://openclaw.ai).

> **Note:** The official `@openclaw/line` package is not published to npm. This standalone plugin provides the same functionality and can be installed directly.

---

## Installation

### Option 1 — From npm (recommended)

```bash
openclaw plugins install @rasenx/openclaw-line
```

### Option 2 — Manual install from GitHub

Use this if the npm package is unavailable or you want the latest source.

**Step 1 — Clone the repository**

```bash
git clone https://github.com/rasenx/openclaw-line.git
cd openclaw-line
npm install
```

**Step 2 — Install into OpenClaw**

```bash
# Copy install (standard)
openclaw plugins install /path/to/openclaw-line

# Symlink install (edits take effect immediately — useful for development)
openclaw plugins install -l /path/to/openclaw-line
```

---

## Setup

### Step 1 — Create a LINE Messaging API channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a **Provider** (if you don't have one)
3. Add a new **Messaging API** channel
4. Copy your **Channel access token** and **Channel secret**

### Step 2 — Configure OpenClaw

Add the following to your OpenClaw config (`~/.openclaw/config.json5`):

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "YOUR_CHANNEL_ACCESS_TOKEN",
      channelSecret: "YOUR_CHANNEL_SECRET",
      dmPolicy: "pairing",   // pairing | open | allowlist | disabled
      groupPolicy: "open",   // open | allowlist | disabled
    },
  },
}
```

Using environment variables instead:

```bash
export LINE_CHANNEL_ACCESS_TOKEN=your_token
export LINE_CHANNEL_SECRET=your_secret
```

### Step 3 — Set the webhook URL in LINE Console

1. In your LINE channel settings, enable **Use webhook**
2. Set the webhook URL to:
   ```
   https://<your-gateway-host>/line/webhook
   ```
3. Click **Verify** — LINE requires a publicly reachable HTTPS endpoint

### Step 4 — Restart OpenClaw

```bash
openclaw restart
```

---

## Access Control

| `dmPolicy` | Behaviour |
|------------|-----------|
| `pairing` | New users receive a pairing code and are held until you approve **(default)** |
| `open` | All DMs accepted without approval |
| `allowlist` | Only LINE user IDs listed in `allowFrom` can message |
| `disabled` | All DMs ignored |

**Approve a pairing request:**

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

**Allowlist example:**

```json5
{
  channels: {
    line: {
      dmPolicy: "allowlist",
      allowFrom: ["U4af4980629..."],
    },
  },
}
```

---

## Multi-Account Setup

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
          dmPolicy: "open",
        },
        support: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/support",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Each account gets its own webhook path in the LINE Developers Console.

---

## Rich Messages

Send LINE-specific rich content by including `channelData.line` in your response:

**Quick replies:**

```json
{
  "text": "What would you like to do?",
  "channelData": {
    "line": {
      "quickReplies": ["Status", "Help", "Cancel"]
    }
  }
}
```

**Flex Message:**

```json
{
  "channelData": {
    "line": {
      "flexMessage": {
        "altText": "My card",
        "contents": {
          "type": "bubble",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Hello!", "weight": "bold" }
            ]
          }
        }
      }
    }
  }
}
```

**Location pin:**

```json
{
  "channelData": {
    "line": {
      "location": {
        "title": "Our Office",
        "address": "123 Main St, Tokyo",
        "latitude": 35.681236,
        "longitude": 139.767125
      }
    }
  }
}
```

**Confirm template:**

```json
{
  "channelData": {
    "line": {
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

---

## /card Command

Send Flex Message presets with the `/card` slash command:

```
/card info "Title" "Body text"
/card image https://example.com/img.jpg "Caption"
/card action "Title" "Button Label" https://example.com
/card confirm "Continue?" "Yes" "No"
/card buttons "Pick one" Option1 Option2 Option3
```

---

## Supported Features

| Feature | Supported |
|---------|-----------|
| Direct messages | Yes |
| Group chats | Yes |
| Text messages | Yes |
| Images, video, audio, files | Yes (inbound) |
| Location messages | Yes |
| Flex Messages | Yes |
| Template messages | Yes |
| Quick replies | Yes |
| Reactions | No |
| Threads | No |

---

## License

MIT
