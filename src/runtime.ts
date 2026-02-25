import type { PluginRuntime } from "openclaw/plugin-sdk"

let _runtime: PluginRuntime | null = null

export function setRuntime(runtime: PluginRuntime): void {
  _runtime = runtime
}

export function getRuntime(): PluginRuntime {
  if (!_runtime) throw new Error("[@rasenx/openclaw-line] Runtime not initialized. Was register() called?")
  return _runtime
}
