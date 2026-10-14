"use client"

import { Building2Icon, CheckIcon, ChevronsUpDownIcon, LayoutDashboardIcon, MessageSquareIcon, WrenchIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, type ReactElement } from "react"
import { toast } from "sonner"

import { useI18n } from "@/i18n/provider"
import { fetchChannels, fetchSupportConfigAdmin } from "@/lib/api/admin"
import { listMyOrganizations, switchOrganization, type OrganizationItem } from "@/lib/api/organization"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type WorkspaceKey = "dashboard" | "workbench"

// resolveVisitorChatUrl finds the current AI customer-service channel and
// returns its public chat URL. It prefers the channel configured in the support
// center, then falls back to the first enabled web channel (preferring one bound
// to an AI agent). Returns null when no usable channel exists.
async function resolveVisitorChatUrl(): Promise<string | null> {
  try {
    const config = await fetchSupportConfigAdmin()
    const channelId = config?.aiCustomerService?.channelId?.trim()
    if (config?.aiCustomerService?.enabled && channelId) {
      return `/support/chat?channelId=${encodeURIComponent(channelId)}`
    }
  } catch {
    // fall through to channel discovery
  }
  try {
    const page = await fetchChannels({ channelType: "web", status: 0 })
    const list = page?.results ?? []
    const chosen = list.find((item) => item.aiAgentId > 0) ?? list[0]
    if (chosen?.channelId) {
      return `/support/chat?channelId=${encodeURIComponent(chosen.channelId)}`
    }
  } catch {
    // ignore and fall back to null
  }
  return null
}

export type WorkspaceOption = {
  key: WorkspaceKey
  href: string
  labelKey: string
  icon: typeof LayoutDashboardIcon
}

export const workspaceOptions: WorkspaceOption[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    labelKey: "workspace.dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    key: "workbench",
    href: "/workbench",
    labelKey: "workspace.workbench",
    icon: WrenchIcon,
  },
]

type WorkspaceSwitcherProps = {
  currentWorkspace: WorkspaceKey
  variant?: "sidebar" | "header" | "rail"
  className?: string
  trigger?: ReactElement
}

export function WorkspaceSwitcher({
  currentWorkspace,
  variant = "header",
  className,
  trigger,
}: WorkspaceSwitcherProps) {
  const t = useI18n()
  const [orgs, setOrgs] = useState<OrganizationItem[]>([])
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    let mounted = true
    listMyOrganizations()
      .then((res) => {
        if (mounted && res?.organizations) {
          setOrgs(res.organizations)
          setActiveOrgId(res.currentOrganizationId || res.organizations[0]?.id || null)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const currentOption =
    workspaceOptions.find((item) => item.key === currentWorkspace) ?? workspaceOptions[0]
  const currentOrg = orgs.find((o) => o.id === activeOrgId) || orgs[0]

  const openVisitorChat = async () => {
    const target = await resolveVisitorChatUrl()
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer")
      return
    }
    toast.error(t("workspace.visitorChatUnavailable"))
    window.open("/support/demo", "_blank", "noopener,noreferrer")
  }

  const handleSwitchOrg = async (orgId: number) => {    if (orgId === activeOrgId || switching) return
    setSwitching(true)
    try {
      await switchOrganization(orgId)
      setActiveOrgId(orgId)
      toast.success("Switched organization successfully")
      window.location.reload()
    } catch {
      toast.error("Failed to switch organization")
    } finally {
      setSwitching(false)
    }
  }

  const switchIndicatorClassName =
    "absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-sidebar text-sidebar-foreground/70"

  const triggerClassName = cn(
    "gap-2 text-left",
    variant === "header" &&
      "h-9 rounded-md border border-border/70 bg-background px-2.5 shadow-xs hover:bg-muted",
    variant === "sidebar" &&
      "relative data-[slot=sidebar-menu-button]:p-1.5! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:data-[slot=sidebar-menu-button]:p-0!",
    variant === "rail" &&
      "relative size-8 rounded-md border-0 bg-transparent p-0 shadow-none hover:bg-sidebar-accent",
    className
  )

  const triggerContent =
    variant === "rail" ? (
      <>
        <img
          src="/images/logo.svg"
          alt={t("app.brand")}
          width="32"
          height="32"
          className="size-7 shrink-0 object-contain"
        />
        <span className="sr-only">
          {currentOrg?.name || t("app.brand")} - {t(currentOption.labelKey)}
        </span>
        <ChevronsUpDownIcon className={switchIndicatorClassName} />
      </>
    ) : (
      <>
        <img
          src="/images/logo.svg"
          alt={t("app.brand")}
          width="32"
          height="32"
          className="size-7 shrink-0 object-contain"
        />
        <div className="grid min-w-0 flex-1 text-left leading-tight">
          <span className="truncate text-sm font-semibold">{currentOrg?.name || t("app.brand")}</span>
          <span className="truncate text-xs text-muted-foreground">
            {t(currentOption.labelKey)} {currentOrg?.role ? `• ${currentOrg.role}` : ""}
          </span>
        </div>
        <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        {variant === "sidebar" ? (
          <ChevronsUpDownIcon
            className={cn(switchIndicatorClassName, "hidden group-data-[collapsible=icon]:block")}
          />
        ) : null}
      </>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger ?? <Button variant="ghost" className={triggerClassName} />
        }
      >
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={variant === "sidebar" || variant === "rail" ? "right" : "bottom"}
        sideOffset={8}
        className="w-64 min-w-64"
      >
        {orgs.length > 0 ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Building2Icon className="size-3.5" />
                Organizations / Workspaces
              </DropdownMenuLabel>
              {orgs.map((org) => {
                const isActive = org.id === activeOrgId
                return (
                  <DropdownMenuItem
                    key={org.id}
                    className="cursor-pointer gap-2"
                    onClick={() => handleSwitchOrg(org.id)}
                  >
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="truncate font-medium text-sm">{org.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {org.role || "Member"} {org.plan ? `• ${org.plan}` : ""}
                      </span>
                    </div>
                    {isActive ? <CheckIcon className="size-4 text-primary shrink-0" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("workspace.switchWorkspace")}</DropdownMenuLabel>
          {workspaceOptions.map((item) => (
            <DropdownMenuItem
              key={item.key}
              render={<Link href={item.href} />}
              className="cursor-pointer gap-2"
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
              {item.key === currentWorkspace ? (
                <CheckIcon className="size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => {
              void openVisitorChat()
            }}
          >
            <MessageSquareIcon className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">{t("workspace.visitorChatTest")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
