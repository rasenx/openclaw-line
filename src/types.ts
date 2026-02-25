export type ResolvedAccount = {
  accountId: string
  channelAccessToken: string
  channelSecret: string
  webhookPath: string
  dmPolicy: "pairing" | "allowlist" | "open" | "disabled"
  groupPolicy: "allowlist" | "open" | "disabled"
  allowFrom: string[]
  enabled: boolean
}

export type SendPayload = {
  text?: string
  quickReplies?: string[]
  flexMessage?: {
    altText: string
    contents: Record<string, unknown>
  }
  templateMessage?: {
    type: "confirm" | "buttons"
    text: string
    confirmLabel?: string
    confirmData?: string
    cancelLabel?: string
    cancelData?: string
    actions?: Array<{ label: string; data?: string; uri?: string }>
  }
  location?: {
    title: string
    address: string
    latitude: number
    longitude: number
  }
}

export type ReplyTokenEntry = {
  token: string
  expiresAt: number
}
