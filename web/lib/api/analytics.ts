import { request, requestBlob } from "@/lib/api/client"

export type AnalyticsRange = "today" | "7d" | "30d" | "custom"

export type AnalyticsRangeInfo = {
  range: string
  from: string
  to: string
  days: number
}

export type AnalyticsAIEffectSummary = {
  aiConversations: number
  handoffs: number
  handoffRate: number
  aiResolved: number
  aiResolvedRate: number
  knowledgeRetrieves: number
  knowledgeFails: number
  knowledgeFailRate: number
  agentRuns: number
  agentRunFails: number
  agentRunSuccessRate: number
}

export type AnalyticsAIEffectSeriesPoint = {
  date: string
  aiConversations: number
  handoffs: number
  aiResolved: number
  knowledgeRetrieves: number
  knowledgeFails: number
  agentRuns: number
  agentRunFails: number
}

export type AnalyticsAIEffect = {
  range: AnalyticsRangeInfo
  generatedAt: string
  summary: AnalyticsAIEffectSummary
  series: AnalyticsAIEffectSeriesPoint[]
}

export type AnalyticsStatusCount = {
  status: string
  label: string
  count: number
}

export type AnalyticsNameCount = {
  key: string
  label: string
  count: number
}

export type AnalyticsTicketTrendPoint = {
  date: string
  created: number
  done: number
}

export type AnalyticsTickets = {
  range: AnalyticsRangeInfo
  generatedAt: string
  summary: {
    total: number
    pending: number
    inProgress: number
    done: number
    avgHandleMinutes: number
  }
  statusDistribution: AnalyticsStatusCount[]
  byChannel: AnalyticsNameCount[]
  trend: AnalyticsTicketTrendPoint[]
}

export type AnalyticsQuery = {
  range: AnalyticsRange
  from?: string
  to?: string
  status?: string
  channel?: string
}

function toQuery(query: AnalyticsQuery) {
  const params = new URLSearchParams()
  params.set("range", query.range)
  if (query.range === "custom") {
    if (query.from) {
      params.set("from", query.from)
    }
    if (query.to) {
      params.set("to", query.to)
    }
  }
  if (query.status) {
    params.set("status", query.status)
  }
  if (query.channel) {
    params.set("channel", query.channel)
  }
  return params.toString()
}

export function fetchAnalyticsAIEffect(query: AnalyticsQuery) {
  return request<AnalyticsAIEffect>(
    `/api/dashboard/analytics/ai-effect?${toQuery(query)}`
  )
}

export function fetchAnalyticsTickets(query: AnalyticsQuery) {
  return request<AnalyticsTickets>(
    `/api/dashboard/analytics/ticket?${toQuery(query)}`
  )
}

export function exportAnalyticsAIEffect(query: AnalyticsQuery) {
  return requestBlob(
    `/api/dashboard/analytics/ai-effect/export?${toQuery(query)}`
  )
}

export function exportAnalyticsTickets(query: AnalyticsQuery) {
  return requestBlob(`/api/dashboard/analytics/ticket/export?${toQuery(query)}`)
}
