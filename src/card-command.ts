import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type * as line from "@line/bot-sdk"

// ------------------------------------------------------------------
// Argument parser: handles quoted strings and bare words
// e.g. `"Hello World" foo "bar baz"` → ["Hello World", "foo", "bar baz"]
// ------------------------------------------------------------------
function parseArgs(input: string): string[] {
  const args: string[] = []
  let current = ""
  let inQuote = false
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === " " && !inQuote) {
      if (current.length > 0) {
        args.push(current)
        current = ""
      }
    } else {
      current += ch
    }
    i++
  }
  if (current.length > 0) args.push(current)
  return args
}

// ------------------------------------------------------------------
// Card builders
// ------------------------------------------------------------------
function buildInfoCard(title: string, body: string): line.messagingApi.FlexContainer {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: title, weight: "bold", size: "lg", color: "#1DB446" }],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: body, wrap: true }],
    },
  } as unknown as line.messagingApi.FlexContainer
}

function buildImageCard(
  imageUrl: string,
  caption: string,
): line.messagingApi.FlexContainer {
  return {
    type: "bubble",
    hero: {
      type: "image",
      url: imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: caption ? [{ type: "text", text: caption, wrap: true }] : [],
    },
  } as unknown as line.messagingApi.FlexContainer
}

function buildActionCard(
  title: string,
  label: string,
  url: string,
): line.messagingApi.FlexContainer {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: title, weight: "bold", size: "md", wrap: true }],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: { type: "uri", label, uri: url },
        },
      ],
    },
  } as unknown as line.messagingApi.FlexContainer
}

function buildConfirmTemplate(
  question: string,
  yesLabel: string,
  noLabel: string,
): line.messagingApi.Template {
  return {
    type: "confirm",
    text: question,
    actions: [
      { type: "postback", label: yesLabel, data: yesLabel.toLowerCase() },
      { type: "postback", label: noLabel, data: noLabel.toLowerCase() },
    ],
  }
}

function buildButtonsTemplate(
  title: string,
  buttons: string[],
): line.messagingApi.Template {
  return {
    type: "buttons",
    title,
    text: title,
    actions: buttons.map((b) => ({
      type: "postback" as const,
      label: b.slice(0, 20), // LINE label max 20 chars
      data: b,
    })),
  }
}

// ------------------------------------------------------------------
// Register /card command
// ------------------------------------------------------------------
export function registerCardCommands(api: OpenClawPluginApi): void {
  api.registerCommand({
    trigger: "/card",
    description: "Send a LINE Flex Message card. Usage: /card <type> [args...]",
    channels: ["line"],
    handler: async (ctx) => {
      const raw = ctx.args?.trim() ?? ""
      const parts = raw.split(/\s+/)
      const cardType = parts[0]
      const rest = raw.slice(cardType.length).trim()
      const args = parseArgs(rest)

      switch (cardType) {
        case "info": {
          // /card info "Title" "Body text"
          const title = args[0] ?? "Info"
          const body = args[1] ?? ""
          await ctx.sendFlexMessage({
            altText: title,
            contents: buildInfoCard(title, body),
          })
          break
        }

        case "image": {
          // /card image <url> "Caption"
          const url = args[0] ?? ""
          const caption = args[1] ?? ""
          if (!url) {
            await ctx.sendText("Usage: /card image <url> \"Caption\"")
            break
          }
          await ctx.sendFlexMessage({
            altText: caption || "Image",
            contents: buildImageCard(url, caption),
          })
          break
        }

        case "action": {
          // /card action "Title" "Button label" <url>
          const title = args[0] ?? "Action"
          const label = args[1] ?? "Open"
          const url = args[2] ?? ""
          if (!url) {
            await ctx.sendText("Usage: /card action \"Title\" \"Label\" <url>")
            break
          }
          await ctx.sendFlexMessage({
            altText: title,
            contents: buildActionCard(title, label, url),
          })
          break
        }

        case "confirm": {
          // /card confirm "Question" "Yes label" "No label"
          const question = args[0] ?? "Continue?"
          const yesLabel = args[1] ?? "Yes"
          const noLabel = args[2] ?? "No"
          await ctx.sendTemplateMessage({
            altText: question,
            template: buildConfirmTemplate(question, yesLabel, noLabel),
          })
          break
        }

        case "buttons": {
          // /card buttons "Title" btn1 btn2 btn3 btn4
          const title = args[0] ?? "Choose"
          const buttons = args.slice(1)
          if (buttons.length === 0) {
            await ctx.sendText("Usage: /card buttons \"Title\" btn1 btn2 btn3")
            break
          }
          await ctx.sendTemplateMessage({
            altText: title,
            template: buildButtonsTemplate(title, buttons.slice(0, 4)), // LINE max 4 buttons
          })
          break
        }

        default:
          await ctx.sendText(
            "Available card types: info, image, action, confirm, buttons\n" +
            "Examples:\n" +
            "  /card info \"Title\" \"Body\"\n" +
            "  /card image https://example.com/img.jpg \"Caption\"\n" +
            "  /card action \"Title\" \"Open\" https://example.com\n" +
            "  /card confirm \"Continue?\" \"Yes\" \"No\"\n" +
            "  /card buttons \"Pick one\" Option1 Option2 Option3",
          )
      }
    },
  })
}
