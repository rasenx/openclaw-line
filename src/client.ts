import * as line from "@line/bot-sdk"

const clientCache = new Map<string, line.messagingApi.MessagingApiClient>()

function getClient(channelAccessToken: string): line.messagingApi.MessagingApiClient {
  const cached = clientCache.get(channelAccessToken)
  if (cached) return cached
  const client = new line.messagingApi.MessagingApiClient({ channelAccessToken })
  clientCache.set(channelAccessToken, client)
  return client
}

export async function replyText(
  channelAccessToken: string,
  replyToken: string,
  text: string,
): Promise<void> {
  await getClient(channelAccessToken).replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  })
}

export async function replyMessages(
  channelAccessToken: string,
  replyToken: string,
  messages: line.messagingApi.Message[],
): Promise<void> {
  await getClient(channelAccessToken).replyMessage({ replyToken, messages })
}

export async function pushText(
  channelAccessToken: string,
  to: string,
  text: string,
): Promise<void> {
  await getClient(channelAccessToken).pushMessage({
    to,
    messages: [{ type: "text", text }],
  })
}

export async function pushMessages(
  channelAccessToken: string,
  to: string,
  messages: line.messagingApi.Message[],
): Promise<void> {
  await getClient(channelAccessToken).pushMessage({ to, messages })
}

export async function pushFlex(
  channelAccessToken: string,
  to: string,
  altText: string,
  contents: line.messagingApi.FlexContainer,
): Promise<void> {
  await getClient(channelAccessToken).pushMessage({
    to,
    messages: [{ type: "flex", altText, contents }],
  })
}

export async function pushTemplate(
  channelAccessToken: string,
  to: string,
  altText: string,
  template: line.messagingApi.Template,
): Promise<void> {
  await getClient(channelAccessToken).pushMessage({
    to,
    messages: [{ type: "template", altText, template }],
  })
}

export async function pushLocation(
  channelAccessToken: string,
  to: string,
  title: string,
  address: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  await getClient(channelAccessToken).pushMessage({
    to,
    messages: [{ type: "location", title, address, latitude, longitude }],
  })
}

export async function replyWithQuickReplies(
  channelAccessToken: string,
  replyToken: string,
  text: string,
  items: string[],
): Promise<void> {
  const quickReply: line.messagingApi.QuickReply = {
    items: items.map((label) => ({
      type: "action" as const,
      action: { type: "message" as const, label, text: label },
    })),
  }
  await getClient(channelAccessToken).replyMessage({
    replyToken,
    messages: [{ type: "text", text, quickReply }],
  })
}

export async function getProfile(
  channelAccessToken: string,
  userId: string,
): Promise<line.messagingApi.UserProfileResponse> {
  return getClient(channelAccessToken).getProfile(userId)
}

export async function getMessageContent(
  channelAccessToken: string,
  messageId: string,
): Promise<Blob> {
  return getClient(channelAccessToken).getMessageContent(messageId)
}
