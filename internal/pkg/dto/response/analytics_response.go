package response

// AnalyticsRangeResponse describes the resolved reporting window.
type AnalyticsRangeResponse struct {
	Range string `json:"range"`
	From  string `json:"from"`
	To    string `json:"to"`
	Days  int    `json:"days"`
}

// AnalyticsAIEffectSummaryResponse holds range totals for AI effectiveness.
type AnalyticsAIEffectSummaryResponse struct {
	AIConversations     int64   `json:"aiConversations"`
	Handoffs            int64   `json:"handoffs"`
	HandoffRate         float64 `json:"handoffRate"`
	AIResolved          int64   `json:"aiResolved"`
	AIResolvedRate      float64 `json:"aiResolvedRate"`
	KnowledgeRetrieves  int64   `json:"knowledgeRetrieves"`
	KnowledgeFails      int64   `json:"knowledgeFails"`
	KnowledgeFailRate   float64 `json:"knowledgeFailRate"`
	AgentRuns           int64   `json:"agentRuns"`
	AgentRunFails       int64   `json:"agentRunFails"`
	AgentRunSuccessRate float64 `json:"agentRunSuccessRate"`
}

// AnalyticsAIEffectSeriesPointResponse is one daily bucket of AI metrics.
type AnalyticsAIEffectSeriesPointResponse struct {
	Date               string `json:"date"`
	AIConversations    int64  `json:"aiConversations"`
	Handoffs           int64  `json:"handoffs"`
	AIResolved         int64  `json:"aiResolved"`
	KnowledgeRetrieves int64  `json:"knowledgeRetrieves"`
	KnowledgeFails     int64  `json:"knowledgeFails"`
	AgentRuns          int64  `json:"agentRuns"`
	AgentRunFails      int64  `json:"agentRunFails"`
}

type AnalyticsAIEffectResponse struct {
	Range       AnalyticsRangeResponse                   `json:"range"`
	GeneratedAt string                                   `json:"generatedAt"`
	Summary     AnalyticsAIEffectSummaryResponse         `json:"summary"`
	Series      []AnalyticsAIEffectSeriesPointResponse   `json:"series"`
}

// AnalyticsTicketSummaryResponse holds range totals for tickets.
type AnalyticsTicketSummaryResponse struct {
	Total            int64   `json:"total"`
	Pending          int64   `json:"pending"`
	InProgress       int64   `json:"inProgress"`
	Done             int64   `json:"done"`
	AvgHandleMinutes float64 `json:"avgHandleMinutes"`
}

type AnalyticsStatusCountResponse struct {
	Status string `json:"status"`
	Label  string `json:"label"`
	Count  int64  `json:"count"`
}

type AnalyticsNameCountResponse struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type AnalyticsTicketTrendPointResponse struct {
	Date    string `json:"date"`
	Created int64  `json:"created"`
	Done    int64  `json:"done"`
}

type AnalyticsTicketResponse struct {
	Range              AnalyticsRangeResponse                `json:"range"`
	GeneratedAt        string                                `json:"generatedAt"`
	Summary            AnalyticsTicketSummaryResponse        `json:"summary"`
	StatusDistribution []AnalyticsStatusCountResponse        `json:"statusDistribution"`
	ByChannel          []AnalyticsNameCountResponse          `json:"byChannel"`
	Trend              []AnalyticsTicketTrendPointResponse   `json:"trend"`
}
