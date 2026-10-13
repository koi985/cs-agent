# 客服Agent 改造设计说明（Design Spec）

- 日期：2026-10-13
- 状态：待评审
- 仓库：`D:\Duihua\cs-agent`（基于 huabeitech/cs-agent 本地构建）
- 适用路径：`docs/superpowers/specs/2026-10-13-customer-service-agent-design.md`

## 1. 背景与目标

在现有 CsAgent（AI 客服/工单系统，Go + Next.js）基础上做三件事，使其"不再有原作者痕迹"并增强分析能力：

1. **品牌替换**：产品显示名改为「客服Agent」/「Customer Service Agent」。
2. **UI 深度重构**：重排信息架构、导航与布局，并统一设计语言。
3. **功能加法**：新增「数据看板与报表」——具体为 **AI 效果分析** 与 **工单分析**，并支持 **CSV 导出**。

### 成功标准

- 面向用户的界面与文档中不再出现 `CsAgent` / `AGENT DESK` / `贝壳` / `huabei` 等原作者痕迹。
- 品牌名在 zh-CN / en-US 两个语言下均正确显示。
- 新的信息架构与设计语言在所有页面一致落地，且满足商业级 UI 标准（AGENTS.md §5.4）。
- 新增分析页可正确展示 AI 效果与工单指标的聚合与趋势，并可导出 CSV。
- 现有功能不回退；构建与校验命令全部通过。

## 2. 范围与非目标

### 范围（In scope）

- **A 层品牌替换**：用户可见的产品名、文案、Logo、favicon、演示数据、README 文档。
- **UI 深度重构**：设计系统 token、导航/信息架构、Dashboard 壳层、工作台、访客侧布局。
- **分析模块**：AI 效果分析 + 工单分析（后端接口 + 前端页面 + CSV 导出）。

### 非目标（Out of scope）

- **不改** Go module 名 `cs-agent`、包导入路径（516 文件）、Docker 镜像名 `mlogclub/cs-agent`、MySQL 账号 `cs_ai_agent`。
- **不改** 前端全局标识：`window.CsAgentConfig` / `CsAgentWidget`、`__CS_AI_AGENT_WIDGET_CONFIG__`、SDK 文件名 `cs-agent-sdk.ts` / `public/sdk/cs-agent-sdk.min.js`、包名 `web/package.json#name`、`@cs-agent/flowgram-editor`。
- **不移除 / 替换** 第三方依赖 `github.com/mlogclub/simple`、`github.com/mlogclub/codegen`。
- **不删除** `LICENSE`(Apache-2.0) 文本与任何版权声明。
- 不改动数据库表结构除分析所需的只读聚合查询外（本设计不新增持久化表）。

## 3. 决策摘要（已与用户确认）

| 决策项 | 结论 |
|---|---|
| 中文显示名 | **客服Agent** |
| 英文显示名 | **Customer Service Agent** |
| 去痕迹边界 | **仅 A 层**（用户可见） |
| UI 改动幅度 | **深度重构** |
| 新增功能 | **AI 效果分析 + 工单分析** |
| CSV 导出 | **需要** |
| Logo | 由实现方（AI）制作 |
| 演示数据 | 改为**中性 / 自研示例** |
| 实施方式 | **方案甲：P1 → P2 → P3**，逐段可发布可验证 |

## 4. 全局约束

- **许可证**：保留 `LICENSE`(Apache-2.0) 与版权声明；仅改产品品牌，不宣称原始代码著作权。
- **国际化**：所有新增/修改的用户可见文案必须同时提供 `web/messages/zh-CN.json` 与 `en-US.json`；后端用户可见错误需同时更新 `internal/pkg/i18nx/locales/zh-CN.yml` 与 `en-US.yml`。
- **主题**：保留浅色/深色两套（`web/lib/theme.ts` 机制不变）。
- **无障碍与商业级 UI**：遵循 AGENTS.md §5.4（交互状态完整、响应式、语义化控件、对比度、focus 可见、空/loading/error 状态）。
- **构建一致性**：沿用本地既有改动（`Dockerfile` 的 `--no-frozen-lockfile`、qdrant 子模块 HTTPS URL、本地 git `insteadOf`）。
- **不编辑生成物**：`web/lib/generated/enums.ts`、`web/public/sdk/cs-agent-sdk.min.js`、`web/public/flowgram-editor/*` 由生成流程产出，不手改。

## 5. P1 · 品牌替换

### 5.1 文案改动

| 文件 | 现状 | 改为 |
|---|---|---|
| `internal/bootstrap/banner.go`（+ `banner_test.go`） | ASCII 横幅 `:: AGENT DESK ::` | 新名横幅（重绘 ASCII 或改为简洁文字横幅，保留 `::` 风格） |
| `web/app/(support)/layout.tsx` | `title: "CsAgent Support"` / `description: "CsAgent Support Center"` | 英文名（如 `Customer Service Agent` / `Customer Service Agent Support Center`） |
| `web/app/(support)/support/_components/support-header.tsx:120` | `companyName \|\| "AGENT DESK"` | 兜底改为当前语言下的品牌名 |
| `web/app/(support)/support/_components/support-mobile-menu.tsx:50` | 硬编码 `AGENT DESK` | 同上，走 i18n |
| `web/messages/zh-CN.json` / `en-US.json` | 可能含产品名键 | 审计后替换为 客服Agent / Customer Service Agent |
| `README.md` / `README_ZH.md` | `# CsAgent` + `cs-agent.huabei.pro` 链接 | 产品名替换；移除/中性化作者域名与仓库链接 |
| `.env.example` | 头注释 `CsAgent Environment Variables` | 中性化 |
| `.codex/skills/release-version/SKILL.md` | `huabeitech/cs-agent` 链接 | 中性化（占位或移除具体仓库地址） |

> 说明：`companyName` 来自 `server.companyName` 配置，非空时优先生效；`fallback` 仅在其为空时显示。

### 5.2 资产

- 新增 `web/public/images/logo.svg`（主用）与需要的 `logo.png`/`logo.jpg`（被 `workspace-switcher.tsx`、`login-page.tsx`、`legal-document-page.tsx` 引用）。
- 替换 `web/app/favicon.ico`。
- `screenshots/*`：README 引用，替换为新界面截图或从 README 移除。
- 依据：`git grep` 显示 logo 引用点集中在 `workspace-switcher.tsx:116,130`、`login-page.tsx:116`、`legal-document-page.tsx:48`。

### 5.3 演示数据（种子）

- `cmd/testdata/seeds/aiagent.go`：`"CsAgent Pre-sales Support"`、`"贝壳AI（CsAgent）"`、欢迎语等 → 中性/自研示例。
- `cmd/testdata/seeds/channel.go`：`"Powered by CsAgent"` 副标题 → 中性。
- `cmd/testdata/seeds/kb.go`：`"CsAgent Support Platform FAQ"` → 中性。
- `cmd/testdata/seeds/quickreply.go`、`tag.go`：含 `CsAgent` 的示例 → 中性。
- `cmd/testdata/aiagent/init_test.go`：断言字符串同步更新。

### 5.4 P1 验收

- 全仓库 `git grep -i "CsAgent\|AGENT DESK\|贝壳\|huabei"` 在**用户可见路径**下无残留（A 层清单内）。
- zh/en 界面显示正确名称；Logo/favicon 生效。
- `cd web && pnpm build` 与后端 `go build ./...` 通过。

## 6. P2 · UI 深度重构

### 6.1 设计系统（Tailwind v4 + CSS 变量）

- 改写主题 token：`web/app/(dashboard)/dashboard.css`（浅/深两套），以及访客侧对应样式（若独立）。
- **默认提案（可在实施时按浏览器实测微调）**：
  - 主色 `--primary`：浅色 `#4F46E5`（indigo-600）/ 深色 `#818CF8`（indigo-400），替换现 `#2475fc`/`#6da2ff`
  - 中性：`--background #F8FAFC` / `--foreground #0F172A`，边框/输入/卡片对应 slate 阶
  - 圆角：统一 `--radius` = 8px，组件统一 `rounded-md`（AGENTS.md §5.4）
  - 字体与字号阶梯、间距、阴影规范：沿用现有字体栈，必要时引入可变字体（如 Inter）与中文回退
  - 语义色（destructive/success/warning）保持可用并适配明暗
- 禁止：无意义渐变、过度阴影/玻璃态、装饰性 emoji、随机强调色（AGENTS.md §5.4）。

### 6.2 信息架构与导航

- 改 `web/lib/navigation.tsx` 与 Dashboard 侧栏壳层的分组/顺序；标签全部走 i18n。
- 目标分组（草案）：

| 分组 | 菜单项 |
|---|---|
| 概览 | 总览 / **分析看板（新）** |
| 服务 | 会话 / 会话监控 / 工单 / 客户 |
| AI | AI Agent / AI 配置 / AI 工作流 / Skill / MCP |
| 知识 | 知识库 / 文档中心 / 快捷回复 |
| 渠道 | 接入渠道 / 企微 Outbox |
| 团队 | 客服 / 客服组 / 排班 / 标签 |
| 系统 | 用户 / 角色 / 权限 / 组织 / 公司 / 通知 / 系统设置 |

- 与现有一级路由的映射以 `web/app/(dashboard)/dashboard/*` 实际目录为准；重命名菜单标签不等于改路由路径（路由保持不变以避免破坏链接）。

### 6.3 布局重排

- Dashboard 壳层：侧栏（分组、折叠、当前态）、顶栏（面包屑/搜索/通知/主题/用户菜单）。
- 工作台：会话列表 + 会话详情 + 右侧信息面板的比例与留白。
- 访客侧：`web/app/(support)/*` 页头/页脚/聊天页，与新设计语言一致。
- 保持：响应式（桌面/窄屏）、键盘可达、focus 可见、明暗一致、空/loading/error 状态完整。

### 6.4 P2 涉及文件（主要）

`web/lib/navigation.tsx`、`web/components/dashboard/*`、`web/app/(dashboard)/layout.tsx`、`web/app/(dashboard)/dashboard/layout.tsx`、`web/app/(support)/*`、`web/messages/zh-CN.json`、`web/messages/en-US.json`、`web/app/(dashboard)/dashboard.css`。

### 6.5 P2 验收

- 逐屏在桌面/窄屏、zh/en、明/暗色下核验（AGENTS.md §5.4，浏览器实测）。
- `cd web && pnpm typecheck && pnpm lint` 通过。

## 7. P3 · 分析模块（AI 效果 + 工单）

基座：现有 `GET /api/dashboard/dashboard/overview`（`internal/services/dashboard_service.go`、`web/.../dashboard/_components/trend-panel.tsx`、`web/components/ui/chart.tsx`）。本模块**新增**独立分析能力，不改动 overview 现有契约。

### 7.1 后端接口

路由组：`/api/dashboard/analytics`（挂载于 `dashboardGroup`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/ai-effect?range=` | AI 效果汇总 + 时间序列 |
| GET | `/ticket?range=&status=&channelId=` | 工单汇总 + 分组 + 趋势 |
| GET | `/ai-effect/export` | AI 效果 CSV |
| GET | `/ticket/export` | 工单 CSV |

- `range` 取值：`today` / `7d` / `30d` / `custom`（配合 `from`/`to`，格式 `YYYY-MM-DD`）。
- 权限：沿用 dashboard 鉴权中间件；新增/复用权限码（如 `analytics.view`），同步至权限表与角色。

### 7.2 指标定义

**AI 效果**
- AI 会话数：`service_mode ∈ {ai_only, ai_first}` 的会话数
- AI 解决率：AI 会话中未转人工且已关闭 / AI 会话数
- 转人工率：`handoff_at` 非空的会话 / AI 会话数
- 知识检索次数、检索失败率：基于 `t_knowledge_retrieve_log`
- Agent 运行成功率：基于 `t_agent_run` 成功/总数
- 时间序列：按日聚合上述指标

**工单**
- 总量、状态分布（`t_ticket.status`）
- 按渠道（`channel`）、按受理客服（`current_assignee_id`）
- 新建/关闭趋势：按 `created_at` / `handled_at`
- 平均处理时长：`handled_at - created_at` 均值

> 实现时以实际列名为准（`t_conversation`/`t_ticket`/`t_knowledge_retrieve_log`/`t_agent_run`），放在 `internal/repositories/analytics_repository.go`，聚合 SQL 保持 SQLite/MySQL 双兼容（AGENTS.md §4.2）。

### 7.3 后端文件

- `internal/handlers/dashboard/analytics_handler.go`
- `internal/services/analytics_service.go`（+ `_test.go`）
- `internal/repositories/analytics_repository.go`
- `internal/pkg/dto/response/analytics_response.go`
- `internal/bootstrap/routes.go`（新增 `registerDashboardAnalyticsRoutes`）
- `internal/pkg/i18nx/locales/{zh-CN,en-US}.yml`（新增错误键）

### 7.4 CSV 导出

- UTF-8 **带 BOM**，CRLF，表头为当前语言文案；`Content-Type: text/csv; charset=utf-8`，`Content-Disposition: attachment`。
- 大数据量按行流式写出，避免一次性加载。

### 7.5 前端

- 新页 `web/app/(dashboard)/dashboard/analytics/page.tsx`：
  - Tab：AI 效果 / 工单
  - 时间范围选择：今日 / 7天 / 30天 / 自定义
  - 图表：复用 `web/components/ui/chart.tsx`（recharts）；卡 + 折线/柱状/饼图
  - 明细表：状态/渠道/客服/时长
  - 操作：**导出 CSV**（每 Tab 一个按钮）
- API 客户端：`web/lib/api/analytics.ts`（经 `web/lib/api/client.ts`）
- 文案：zh/en 双侧新增键

### 7.6 P3 验收

- 聚合数值正确性：为 `analytics_service` 编写聚焦单测。
- 页面在桌面/窄屏、zh/en、明暗色下正常；loading/empty/error 完整。
- CSV 下载后 Excel 打开中文不乱码。
- `go test ./...`、`cd web && pnpm typecheck && pnpm lint` 通过。

## 8. 数据与接口契约（摘要）

- 复用 `JsonResult` / `PageResult` 契约（AGENTS.md §4.4）。
- 分层：handlers → services → repositories；handlers 不直接查库；模型经 builders/DTO 输出。
- 本设计**不新增持久化表**；分析为只读聚合。

## 9. 验证矩阵（每阶段）

| 项 | 命令 / 方式 |
|---|---|
| 前端类型 | `cd web && pnpm typecheck` |
| 前端规范 | `cd web && pnpm lint` |
| 后端单测 | `go test ./...` |
| 后端格式 | `gofmt`（改动 .go） |
| 界面 | 浏览器实测：桌面/窄屏、zh/en、明/暗、各交互状态 |
| 品牌残留 | `git grep -i "CsAgent\|AGENT DESK\|贝壳\|huabei"` 于用户可见路径 |
| 许可证 | 确认 `LICENSE` 未改动且版权声明保留 |

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| P2 深度重构主观性强、返工风险高 | P2 开始先产出 1~2 个视觉方向供选择，再铺开 |
| 双语漏翻 | 每次改动同时更新 zh/en；lint/自查 |
| 主题变量改动影响面广导致局部错位 | 先改 token → 逐屏核验 → 再改布局 |
| SQL 双数据库兼容 | 仅用通用聚合，避免方言特有函数 |
| 分析指标口径歧义 | spec 中固定口径；实现前若有分歧再确认 |
| 品牌替换误伤代码标识符 | 严格遵守"仅 A 层"清单，不碰 B 层 |
| 许可证合规 | 保留 LICENSE 与版权声明，仅改品牌 |

## 11. 交付顺序

1. 本 spec 评审通过。
2. `writing-plans` 生成分阶段实施计划。
3. P1 品牌替换 → 验收。
4. P2 UI 深度重构 → 验收（先选视觉方向）。
5. P3 分析模块 → 验收。

## 12. 未决问题

无（4 个待确认项已由用户答复：英文名 Customer Service Agent、Logo 由实现方制作、需要 CSV、演示数据中性化）。
