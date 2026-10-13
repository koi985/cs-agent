import {
  BarChart3Icon,
  BotMessageSquareIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  Building2Icon,
  CalendarClockIcon,
  FileTextIcon,
  CircleHelpIcon,
  GlobeIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MessageSquareWarningIcon,
  MessageSquareCodeIcon,
  MessageSquareMoreIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagsIcon,
  UserCogIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/** Keep in sync with backend internal/pkg/constants/auth.go RoleCodeSuperAdmin. */
export const DASHBOARD_ROLE_SUPER_ADMIN = "super_admin";

export type DashboardNavMenuItem = {
  title: string;
  titleKey: string;
  url: string;
  icon: ReactNode;
};

export type DashboardNavItemConfig = Omit<DashboardNavMenuItem, "title"> & {
  /**
   * Keep in sync with backend Permission.Code. Missing value means any signed-in
   * admin can see the module.
   */
  requiredPermission?: string;
};

export type DashboardNavSectionConfig = {
  titleKey: string;
  icon: ReactNode;
  items: DashboardNavItemConfig[];
};

function navItemVisible(
  item: DashboardNavItemConfig,
  superAdmin: boolean,
  permissionSet: Set<string>,
): boolean {
  if (superAdmin) {
    return true;
  }
  if (!item.requiredPermission) {
    return true;
  }
  return permissionSet.has(item.requiredPermission);
}

export function filterDashboardNavForSession(
  permissions: readonly string[] | undefined,
  roles: readonly string[] | undefined,
): { titleKey: string; icon: ReactNode; items: DashboardNavMenuItem[] }[] {
  const superAdmin = roles?.includes(DASHBOARD_ROLE_SUPER_ADMIN) ?? false;
  const permissionSet = new Set(permissions ?? []);
  return dashboardNavSections
    .map((section) => ({
      titleKey: section.titleKey,
      icon: section.icon,
      items: section.items
        .filter((item) => navItemVisible(item, superAdmin, permissionSet))
        .map(({ titleKey, url, icon }) => ({ title: titleKey, titleKey, url, icon })),
    }))
    .filter((section) => section.items.length > 0);
}

export function filterDashboardSecondaryNavForSession(
  permissions: readonly string[] | undefined,
  roles: readonly string[] | undefined,
): DashboardNavMenuItem[] {
  const superAdmin = roles?.includes(DASHBOARD_ROLE_SUPER_ADMIN) ?? false;
  const permissionSet = new Set(permissions ?? []);
  return dashboardSecondaryNav
    .filter((item) => navItemVisible(item, superAdmin, permissionSet))
    .map(({ titleKey, url, icon }) => ({ title: titleKey, titleKey, url, icon }));
}

export const dashboardNavSections: DashboardNavSectionConfig[] = [
  {
    titleKey: "nav.sectionOverview",
    icon: <LayoutDashboardIcon />,
    items: [
      {
        titleKey: "nav.overview",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        titleKey: "nav.analytics",
        url: "/dashboard/analytics",
        icon: <BarChart3Icon />,
        requiredPermission: "conversation.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionService",
    icon: <BotMessageSquareIcon />,
    items: [
      {
        titleKey: "nav.conversations",
        url: "/dashboard/conversations",
        icon: <BotMessageSquareIcon />,
        requiredPermission: "conversation.view",
      },
      {
        titleKey: "nav.conversationMonitor",
        url: "/dashboard/conversation-monitor",
        icon: <MessageSquareMoreIcon />,
        requiredPermission: "conversation.view",
      },
      {
        titleKey: "nav.tickets",
        url: "/dashboard/tickets",
        icon: <FileTextIcon />,
        requiredPermission: "ticket.view",
      },
      {
        titleKey: "nav.customers",
        url: "/dashboard/customers",
        icon: <UsersIcon />,
        requiredPermission: "customer.view",
      },
      {
        titleKey: "nav.companies",
        url: "/dashboard/companies",
        icon: <Building2Icon />,
        requiredPermission: "company.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionAI",
    icon: <BrainCircuitIcon />,
    items: [
      {
        titleKey: "nav.aiConfigs",
        url: "/dashboard/ai-configs",
        icon: <BrainCircuitIcon />,
        requiredPermission: "aiConfig.view",
      },
      {
        titleKey: "nav.aiAgents",
        url: "/dashboard/ai-agents",
        icon: <BotMessageSquareIcon />,
        requiredPermission: "aiAgent.view",
      },
      {
        titleKey: "nav.workflows",
        url: "/dashboard/ai-workflows",
        icon: <WorkflowIcon />,
        requiredPermission: "aiAgent.view",
      },
      {
        titleKey: "nav.workflowRuns",
        url: "/dashboard/ai-workflow-runs",
        icon: <WorkflowIcon />,
        requiredPermission: "aiAgent.view",
      },
      {
        titleKey: "nav.agentRuns",
        url: "/dashboard/agent-runs",
        icon: <BotMessageSquareIcon />,
        requiredPermission: "aiAgent.view",
      },
      {
        titleKey: "nav.skillDefinition",
        url: "/dashboard/skill-definition",
        icon: <MessageSquareCodeIcon />,
        requiredPermission: "skillDefinition.view",
      },
      {
        titleKey: "nav.mcp",
        url: "/dashboard/mcp",
        icon: <MessageSquareCodeIcon />,
        requiredPermission: "mcp.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionKnowledge",
    icon: <BookOpenIcon />,
    items: [
      {
        titleKey: "nav.knowledge",
        url: "/dashboard/knowledge",
        icon: <FileTextIcon />,
        requiredPermission: "knowledgeBase.view",
      },
      {
        titleKey: "nav.supportDocs",
        url: "/dashboard/support/docs",
        icon: <BookOpenIcon />,
        requiredPermission: "docPage.view",
      },
      {
        titleKey: "nav.supportCommunity",
        url: "/dashboard/support/community",
        icon: <CircleHelpIcon />,
        requiredPermission: "supportCommunity.view",
      },
      {
        titleKey: "nav.supportCommunityCategories",
        url: "/dashboard/support/community-categories",
        icon: <TagsIcon />,
        requiredPermission: "supportCommunity.view",
      },
      {
        titleKey: "nav.quickReplies",
        url: "/dashboard/quick-replies",
        icon: <MessageSquareMoreIcon />,
        requiredPermission: "quickReply.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionChannels",
    icon: <GlobeIcon />,
    items: [
      {
        titleKey: "nav.channels",
        url: "/dashboard/channels",
        icon: <GlobeIcon />,
        requiredPermission: "channel.view",
      },
      {
        titleKey: "nav.wxworkOutbox",
        url: "/dashboard/wxwork-outbox",
        icon: <MessageSquareWarningIcon />,
        requiredPermission: "wxworkOutbox.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionTeam",
    icon: <UserCogIcon />,
    items: [
      {
        titleKey: "nav.agents",
        url: "/dashboard/agents",
        icon: <UserCogIcon />,
        requiredPermission: "agent.view",
      },
      {
        titleKey: "nav.agentTeamSchedules",
        url: "/dashboard/agent-team-schedules",
        icon: <CalendarClockIcon />,
        requiredPermission: "agentTeamSchedule.view",
      },
      {
        titleKey: "nav.tags",
        url: "/dashboard/tags",
        icon: <TagsIcon />,
        requiredPermission: "tag.view",
      },
    ],
  },
  {
    titleKey: "nav.sectionSystem",
    icon: <ShieldCheckIcon />,
    items: [
      {
        titleKey: "nav.users",
        url: "/dashboard/users",
        icon: <UsersIcon />,
        requiredPermission: "user.view",
      },
      {
        titleKey: "nav.roles",
        url: "/dashboard/roles",
        icon: <ShieldCheckIcon />,
        requiredPermission: "role.view",
      },
      {
        titleKey: "nav.permissions",
        url: "/dashboard/permissions",
        icon: <KeyRoundIcon />,
        requiredPermission: "permission.view",
      },
      {
        titleKey: "nav.supportConfig",
        url: "/dashboard/support/config",
        icon: <SettingsIcon />,
        requiredPermission: "supportConfig.view",
      },
    ],
  },
];

export const dashboardSecondaryNav: DashboardNavItemConfig[] = [];

export const dashboardQuickActions = [
  {
    title: "View Conversations",
    icon: <BotMessageSquareIcon />,
  },
  {
    title: "Invite Members",
    icon: <UserCogIcon />,
  },
  {
    title: "Connect Bot",
    icon: <MessageSquareCodeIcon />,
  },
] as const;

export function getPageTitle(pathname: string): string {
  return getPageTitleKey(pathname);
}

export function getPageTitleKey(pathname: string): string {
  let matchedTitle = "nav.dashboardHome";
  let longestMatch = 0;

  for (const section of dashboardNavSections) {
    for (const item of section.items) {
      if (pathname === item.url || pathname.startsWith(item.url + "/")) {
        const matchLength = item.url.length;
        if (matchLength > longestMatch) {
          longestMatch = matchLength;
          matchedTitle = item.titleKey;
        }
      }
    }
  }

  for (const item of dashboardSecondaryNav) {
    if (pathname === item.url || pathname.startsWith(item.url + "/")) {
      const matchLength = item.url.length;
      if (matchLength > longestMatch) {
        longestMatch = matchLength;
        matchedTitle = item.titleKey;
      }
    }
  }

  return matchedTitle;
}

export function getDashboardBreadcrumb(pathname: string): {
  sectionKey: string;
  itemKey: string;
} {
  let sectionKey = "";
  let itemKey = "";
  let longestMatch = 0;

  for (const section of dashboardNavSections) {
    for (const item of section.items) {
      if (pathname === item.url || pathname.startsWith(item.url + "/")) {
        if (item.url.length > longestMatch) {
          longestMatch = item.url.length;
          sectionKey = section.titleKey;
          itemKey = item.titleKey;
        }
      }
    }
  }

  return { sectionKey, itemKey };
}
