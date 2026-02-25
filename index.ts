import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import { setRuntime } from "./src/runtime.js"
import { linePlugin } from "./src/channel.js"
import { createLineWebhookHandler } from "./src/webhook.js"
import { registerCardCommands } from "./src/card-command.js"
import { lineConfigSchema } from "./src/config.js"

export default {
  id: "line",
  name: "LINE",
  description: "LINE Messaging API channel for OpenClaw (@rasenx/openclaw-line)",
  configSchema: lineConfigSchema,
  register(api: OpenClawPluginApi) {
    setRuntime(api.runtime)
    api.registerChannel({ plugin: linePlugin })
    api.registerHttpHandler(createLineWebhookHandler())
    registerCardCommands(api)
  },
}
