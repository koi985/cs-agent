"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DownloadIcon, RefreshCwIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/i18n/provider"
import {
  exportAnalyticsAIEffect,
  exportAnalyticsTickets,
  fetchAnalyticsAIEffect,
  fetchAnalyticsTickets,
  type AnalyticsAIEffect,
  type AnalyticsQuery,
  type AnalyticsRange,
  type AnalyticsTickets,
} from "@/lib/api/analytics"

type AnalyticsTab = "ai" | "ticket"

type AppliedQuery = {
  range: AnalyticsRange
  from: string
  to: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatRate(value: number) {
  return `${value}%`
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="space-y-1 p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}

function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="rounded-md shadow-none">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AnalyticsHome() {
  const t = useI18n()
  const [tab, setTab] = useState<AnalyticsTab>("ai")
  const [range, setRange] = useState<AnalyticsRange>("7d")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [applied, setApplied] = useState<AppliedQuery>({ range: "7d", from: "", to: "" })
  const [aiData, setAiData] = useState<AnalyticsAIEffect | null>(null)
  const [ticketData, setTicketData] = useState<AnalyticsTickets | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const query = useMemo<AnalyticsQuery>(
    () => ({ range: applied.range, from: applied.from, to: applied.to }),
    [applied]
  )

  const load = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      try {
        if (tab === "ai") {
          setAiData(await fetchAnalyticsAIEffect(query))
        } else {
          setTicketData(await fetchAnalyticsTickets(query))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("analytics.loadFailed"))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [query, tab, t]
  )

  useEffect(() => {
    void load()
  }, [load])

  const rangeOptions: Array<{ value: AnalyticsRange; label: string }> = [
    { value: "today", label: t("analytics.rangeToday") },
    { value: "7d", label: t("analytics.range7d") },
    { value: "30d", label: t("analytics.range30d") },
    { value: "custom", label: t("analytics.rangeCustom") },
  ]

  const selectRange = (value: AnalyticsRange) => {
    setRange(value)
    if (value !== "custom") {
      setApplied({ range: value, from: "", to: "" })
    }
  }

  const applyCustom = () => {
    if (!customFrom || !customTo) {
      return
    }
    setApplied({ range: "custom", from: customFrom, to: customTo })
  }

  const onExport = async () => {
    setExporting(true)
    try {
      const result =
        tab === "ai"
          ? await exportAnalyticsAIEffect(query)
          : await exportAnalyticsTickets(query)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename || (tab === "ai" ? "ai-effect.csv" : "tickets.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("analytics.exportFailed"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">{t("analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-md border bg-background p-1">
            {rangeOptions.map((item) => (
              <Button
                key={item.value}
                variant={range === item.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => selectRange(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {range === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                aria-label={t("analytics.from")}
                className="w-40"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                aria-label={t("analytics.to")}
                className="w-40"
              />
              <Button size="sm" variant="outline" onClick={applyCustom}>
                {t("analytics.apply")}
              </Button>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing || loading}
          >
            <RefreshCwIcon className={refreshing ? "animate-spin" : ""} />
            {t("analytics.refresh")}
          </Button>
          <Button size="sm" onClick={() => void onExport()} disabled={exporting}>
            <DownloadIcon />
            {exporting ? t("analytics.exporting") : t("analytics.export")}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as AnalyticsTab)}>
        <TabsList>
          <TabsTrigger value="ai">{t("analytics.tabAi")}</TabsTrigger>
          <TabsTrigger value="ticket">{t("analytics.tabTicket")}</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4">
          {loading && !aiData ? <LoadingCards /> : <AIEffectView data={aiData} />}
        </TabsContent>

        <TabsContent value="ticket" className="mt-4">
          {loading && !ticketData ? <LoadingCards /> : <TicketView data={ticketData} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AIEffectView({ data }: { data: AnalyticsAIEffect | null }) {
  const t = useI18n()
  if (!data) {
    return <p className="text-sm text-muted-foreground">{t("analytics.empty")}</p>
  }
  const summary = data.summary
  const config = {
    aiConversations: { label: t("analytics.ai.seriesAiConversations"), color: "var(--chart-1)" },
    handoffs: { label: t("analytics.ai.seriesHandoffs"), color: "var(--chart-3)" },
    aiResolved: { label: t("analytics.ai.seriesAiResolved"), color: "var(--chart-2)" },
  } satisfies ChartConfig

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("analytics.ai.aiConversations")}
          value={formatNumber(summary.aiConversations)}
        />
        <StatCard
          label={t("analytics.ai.aiResolvedRate")}
          value={formatRate(summary.aiResolvedRate)}
          hint={`${formatNumber(summary.aiResolved)} / ${formatNumber(summary.aiConversations)}`}
        />
        <StatCard
          label={t("analytics.ai.handoffRate")}
          value={formatRate(summary.handoffRate)}
          hint={formatNumber(summary.handoffs)}
        />
        <StatCard
          label={t("analytics.ai.knowledgeFailRate")}
          value={formatRate(summary.knowledgeFailRate)}
          hint={`${formatNumber(summary.knowledgeFails)} / ${formatNumber(summary.knowledgeRetrieves)}`}
        />
        <StatCard
          label={t("analytics.ai.agentRunSuccessRate")}
          value={formatRate(summary.agentRunSuccessRate)}
          hint={`${formatNumber(summary.agentRunFails)} / ${formatNumber(summary.agentRuns)}`}
        />
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>{t("analytics.ai.trendTitle")}</CardTitle>
          <CardDescription>{t("analytics.ai.trendDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-72 w-full">
            <AreaChart data={data.series}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="aiConversations"
                stroke="var(--color-aiConversations)"
                fill="var(--color-aiConversations)"
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="aiResolved"
                stroke="var(--color-aiResolved)"
                fill="var(--color-aiResolved)"
                fillOpacity={0.12}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="handoffs"
                stroke="var(--color-handoffs)"
                fill="var(--color-handoffs)"
                fillOpacity={0.08}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function TicketView({ data }: { data: AnalyticsTickets | null }) {
  const t = useI18n()
  if (!data) {
    return <p className="text-sm text-muted-foreground">{t("analytics.empty")}</p>
  }
  const summary = data.summary
  const statusConfig = {
    count: {
      label: t("analytics.ticket.seriesCount"),
      theme: { light: "hsl(199 89% 48%)", dark: "hsl(199 95% 72%)" },
    },
  } satisfies ChartConfig
  const trendConfig = {
    created: { label: t("analytics.ticket.seriesCreated"), color: "var(--chart-1)" },
    done: { label: t("analytics.ticket.seriesDone"), color: "var(--chart-2)" },
  } satisfies ChartConfig
  const channelConfig = {
    count: {
      label: t("analytics.ticket.seriesCount"),
      theme: { light: "hsl(262 83% 58%)", dark: "hsl(263 90% 76%)" },
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t("analytics.ticket.total")} value={formatNumber(summary.total)} />
        <StatCard label={t("analytics.ticket.pending")} value={formatNumber(summary.pending)} />
        <StatCard label={t("analytics.ticket.inProgress")} value={formatNumber(summary.inProgress)} />
        <StatCard label={t("analytics.ticket.done")} value={formatNumber(summary.done)} />
        <StatCard
          label={t("analytics.ticket.avgHandleMinutes")}
          value={`${summary.avgHandleMinutes} ${t("analytics.ticket.minutes")}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>{t("analytics.ticket.trendTitle")}</CardTitle>
            <CardDescription>{t("analytics.ticket.trendDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-72 w-full">
              <LineChart data={data.trend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="var(--color-created)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="done"
                  stroke="var(--color-done)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>{t("analytics.ticket.statusTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="h-72 w-full">
              <BarChart data={data.statusDistribution} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <XAxis type="number" hide allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {data.byChannel.length > 0 ? (
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>{t("analytics.ticket.channelTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={channelConfig} className="h-64 w-full">
              <BarChart data={data.byChannel}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
