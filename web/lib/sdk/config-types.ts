export type CsAgentConfig = {
  channelId: string
  baseUrl?: string
  apiBaseUrl?: string
  widgetBaseUrl?: string
  /** Stable external visitor ID. Uses the browser-local visitor ID when omitted. */
  externalId?: string
  /** Visitor display name, only used when first exchanging for a chat token. */
  externalName?: string
  /** Gets the user JWT issued by the host system before opening support. */
  getUserToken?: () => string | Promise<string>
  title?: string
  subtitle?: string
  language?: string
  position?: "left" | "right"
  themeColor?: string
  width?: string
}

export type SupportChatRuntimeConfig = Omit<CsAgentConfig, "getUserToken"> & {
  /** Used only by /support/chat to exchange for a chat token; not part of CsAgentConfig. */
  userToken?: string
}

export type CsAgentWidget = {
  mount: (config?: CsAgentConfig) => void
  destroy: () => void
  open: () => Promise<void>
  close: () => void
  getChatUrl: () => Promise<string>
}

declare global {
  interface Window {
    CsAgentConfig?: CsAgentConfig
    CsAgentWidget?: CsAgentWidget
    __CS_AI_AGENT_WIDGET_CONFIG__?: SupportChatRuntimeConfig
    __CS_AI_AGENT_WIDGET_STATE__?: unknown
  }
}
