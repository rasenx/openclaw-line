# LINE Channel Plugin for OpenClaw — Installation Guide (Option 1)

Installing `@openclaw/line` from the OpenClaw monorepo source, since the package is not published to npm.

---

## Prerequisites

- Git installed
- OpenClaw installed and running
- A LINE Developers account with a Messaging API channel
- A publicly reachable HTTPS endpoint for webhooks

---

## Step 1 — Clone the OpenClaw Monorepo

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

---

## Step 2 — Install the LINE Plugin

```bash
openclaw plugins install ./extensions/line
```

> For development (edits take effect immediately without reinstalling):
> ```bash
> openclaw plugins install -l ./extensions/line
> ```

---

## Step 3 — Configure OpenClaw

Add the following to your OpenClaw config file (`~/.openclaw/config.json5`):

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "YOUR_CHANNEL_ACCESS_TOKEN",
      channelSecret: "YOUR_CHANNEL_SECRET",
      dmPolicy: "pairing",  // pairing | allowlist | open | disabled
    },
  },
}
```

### Credential alternatives

Using environment variables:
```bash
export LINE_CHANNEL_ACCESS_TOKEN=your_token_here
export LINE_CHANNEL_SECRET=your_secret_here
```

Using secret files:
```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

---

## Step 4 — Get LINE Credentials

1. Go to https://developers.line.biz/console/
2. Create a **Provider** (if you don't have one)
3. Create a **Messaging API** channel
4. Under the channel settings, copy:
   - **Channel access token** (issue a long-lived token)
   - **Channel secret**

---

## Step 5 — Configure Webhook in LINE Console

1. In your LINE channel settings, enable **Use webhook**
2. Set the webhook URL to:
   ```
   https://<your-gateway-host>/line/webhook
   ```
3. Click **Verify** to confirm LINE can reach your server

> LINE requires HTTPS. Plain HTTP will not work.
> Your OpenClaw gateway must be publicly reachable from LINE's servers.

---

## Step 6 — Restart OpenClaw

```bash
openclaw restart
```

---

## Access Control

The default DM policy is `pairing` — new users who message the bot receive a pairing code and are held until approved.

**Approve a pairing request:**
```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

**Other DM policy options** (`dmPolicy`):
| Value | Behavior |
|-------|----------|
| `pairing` | New users get a code; blocked until you approve (default) |
| `open` | All DMs accepted without approval |
| `allowlist` | Only listed LINE user IDs can message |
| `disabled` | All DMs ignored |

---

## Multi-Account Setup (optional)

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
        support: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/support",
        },
      },
    },
  },
}
```

---

## Supported Features

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
| Streaming responses | Yes |
| Reactions | No |
| Threads | No |

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| 404 on `openclaw plugins install @openclaw/line` | Package not published to npm | Use local path install (Step 2) |
| Webhook verify fails | Gateway not reachable or not HTTPS | Ensure public HTTPS endpoint |
| Messages not received | `dmPolicy: "pairing"` holding new users | Run `openclaw pairing approve line <CODE>` |
| Plugin not loading | TypeScript not supported by runtime | Ensure OpenClaw version supports `.ts` extensions |
