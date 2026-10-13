"use client"

import { useEffect } from "react"

import { useSupportAuth } from "@/app/(support)/support/_components/support-auth-provider"
import {
  fetchSupportAICustomerServiceUserToken,
  fetchSupportConfig,
} from "@/lib/api/support-config"
import type { CsAgentConfig } from "@/lib/sdk/config-types"

const WIDGET_SCRIPT_SELECTOR = '[data-cs-agent-widget="support-platform-script"]'

function removeSupportWidget() {
  window.CsAgentWidget?.destroy()
  document.querySelector(WIDGET_SCRIPT_SELECTOR)?.remove()
  delete window.CsAgentConfig
}

function mountSupportWidget(config: CsAgentConfig) {
  window.CsAgentConfig = config
  if (window.CsAgentWidget) {
    window.CsAgentWidget.mount(config)
    return
  }

  const script = document.createElement("script")
  script.async = true
  script.src = "/sdk/cs-agent-sdk.min.js"
  script.dataset.csAgentWidget = "support-platform-script"
  document.body.appendChild(script)
}

export function SupportAIChatWidget() {
  const { ready, session } = useSupportAuth()

  useEffect(() => {
    if (!ready) {
      return
    }

    let cancelled = false

    async function loadConfig() {
      try {
        const config = await fetchSupportConfig()
        if (cancelled) {
          return
        }
        const aiCustomerService = config.aiCustomerService
        if (!aiCustomerService?.enabled || !aiCustomerService.channelId) {
          removeSupportWidget()
          return
        }
        const widgetConfig: CsAgentConfig = {
          channelId: aiCustomerService.channelId,
          baseUrl: window.location.origin,
          widgetBaseUrl: window.location.origin,
        }
        if (session) {
          widgetConfig.getUserToken = async () => {
            const token = await fetchSupportAICustomerServiceUserToken()
            return token.userToken
          }
        }
        mountSupportWidget(widgetConfig)
      } catch {
        if (!cancelled) {
          removeSupportWidget()
        }
      }
    }

    void loadConfig()

    return () => {
      cancelled = true
      removeSupportWidget()
    }
  }, [ready, session])

  return null
}
