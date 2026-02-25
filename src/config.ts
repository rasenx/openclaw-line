import { z } from "zod"
import type { ResolvedAccount } from "./types.js"

const lineAccountSchema = z.object({
  channelAccessToken: z.string().min(1),
  channelSecret: z.string().min(1),
  webhookPath: z.string().default("/line/webhook"),
  dmPolicy: z.enum(["pairing", "allowlist", "open", "disabled"]).default("pairing"),
  groupPolicy: z.enum(["allowlist", "open", "disabled"]).default("open"),
  allowFrom: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

const lineMultiAccountSchema = z.object({
  accounts: z.record(lineAccountSchema),
})

export const lineConfigSchema = z.object({
  channels: z
    .object({
      line: z.union([lineAccountSchema, lineMultiAccountSchema]).optional(),
    })
    .optional(),
})

export type LineConfig = z.infer<typeof lineConfigSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMultiAccount(cfg: any): cfg is z.infer<typeof lineMultiAccountSchema> {
  return cfg && typeof cfg === "object" && "accounts" in cfg
}

export function resolveAccountIds(cfg: LineConfig): string[] {
  const line = cfg.channels?.line
  if (!line) return []
  if (isMultiAccount(line)) return Object.keys(line.accounts)
  return ["default"]
}

export function resolveLineAccount(cfg: LineConfig, accountId?: string): ResolvedAccount | undefined {
  const line = cfg.channels?.line
  if (!line) return undefined

  if (isMultiAccount(line)) {
    const id = accountId ?? Object.keys(line.accounts)[0]
    const acc = line.accounts[id]
    if (!acc) return undefined
    return { ...acc, accountId: id }
  }

  return { ...line, accountId: accountId ?? "default" }
}
