package services

import (
	"bytes"
	"encoding/csv"
	"sort"
	"strconv"
	"strings"
	"time"

	"cs-agent/internal/pkg/dto/response"
	"cs-agent/internal/pkg/enums"
	"cs-agent/internal/pkg/i18nx"
	"cs-agent/internal/repositories"

	"github.com/mlogclub/simple/sqls"
)

var AnalyticsService = newAnalyticsService()

func newAnalyticsService() *analyticsService {
	return &analyticsService{}
}

type analyticsService struct {
}

var analyticsUTF8BOM = []byte{0xEF, 0xBB, 0xBF}

func parseAnalyticsDay(value string, fallback time.Time) (time.Time, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback, false
	}
	parsed, err := time.ParseInLocation("2006-01-02", value, time.Local)
	if err != nil {
		return fallback, false
	}
	return parsed, true
}

// normalizeAnalyticsRange resolves the requested window into an inclusive start
// and an exclusive end boundary, plus the number of days for bucketing.
func normalizeAnalyticsRange(rangeValue, from, to string) (string, time.Time, time.Time, int) {
	now := time.Now()
	today := startOfDay(now)
	switch strings.TrimSpace(rangeValue) {
	case "today":
		return "today", today, today.AddDate(0, 0, 1), 1
	case "30d":
		return "30d", today.AddDate(0, 0, -29), today.AddDate(0, 0, 1), 30
	case "custom":
		start, okFrom := parseAnalyticsDay(from, today)
		endDay, okTo := parseAnalyticsDay(to, today)
		if okFrom && okTo && !endDay.Before(start) {
			end := endDay.AddDate(0, 0, 1)
			days := int(endDay.Sub(start).Hours()/24) + 1
			return "custom", start, end, days
		}
		fallthrough
	default:
		return "7d", today.AddDate(0, 0, -6), today.AddDate(0, 0, 1), 7
	}
}

func buildAnalyticsDayList(start, end time.Time) []string {
	days := make([]string, 0)
	for current := startOfDay(start); current.Before(end); current = current.AddDate(0, 0, 1) {
		days = append(days, current.Format("2006-01-02"))
	}
	return days
}

func analyticsRangeResponse(label string, start, end time.Time, days int) response.AnalyticsRangeResponse {
	return response.AnalyticsRangeResponse{
		Range: label,
		From:  start.Format("2006-01-02"),
		To:    end.AddDate(0, 0, -1).Format("2006-01-02"),
		Days:  days,
	}
}

func calcSuccessRate(total, failed int64) float64 {
	return calcRate(total-failed, total)
}

func (s *analyticsService) GetAIEffect(rangeValue, from, to string) response.AnalyticsAIEffectResponse {
	label, start, end, days := normalizeAnalyticsRange(rangeValue, from, to)
	db := sqls.DB()

	conversations := repositories.AnalyticsRepository.ListConversationAnalytics(db, start, end)
	runs := repositories.AnalyticsRepository.ListAgentRunAnalytics(db, start, end)
	logs := repositories.AnalyticsRepository.ListKnowledgeLogAnalytics(db, start, end)

	type bucket struct {
		ai       int64
		handoffs int64
		resolved int64
		retrieve int64
		fail     int64
		runs     int64
		runFail  int64
	}
	dayList := buildAnalyticsDayList(start, end)
	series := make(map[string]*bucket, len(dayList))
	for _, day := range dayList {
		series[day] = &bucket{}
	}
	var sum bucket

	for _, c := range conversations {
		isAI := c.ServiceMode == int(enums.IMConversationServiceModeAIOnly) ||
			c.ServiceMode == int(enums.IMConversationServiceModeAIFirst)
		if !isAI {
			continue
		}
		day := c.CreatedAt.Format("2006-01-02")
		sum.ai++
		if series[day] != nil {
			series[day].ai++
		}
		if c.HandoffAt != nil {
			sum.handoffs++
			if series[day] != nil {
				series[day].handoffs++
			}
		}
		if c.Status == int(enums.IMConversationStatusClosed) && c.HandoffAt == nil {
			sum.resolved++
			if series[day] != nil {
				series[day].resolved++
			}
		}
	}

	for _, l := range logs {
		day := l.CreatedAt.Format("2006-01-02")
		sum.retrieve++
		if series[day] != nil {
			series[day].retrieve++
		}
		if l.AnswerStatus == 2 || l.AnswerStatus == 3 || l.AnswerStatus == 4 {
			sum.fail++
			if series[day] != nil {
				series[day].fail++
			}
		}
	}

	for _, run := range runs {
		day := run.CreatedAt.Format("2006-01-02")
		sum.runs++
		if series[day] != nil {
			series[day].runs++
		}
		if run.Status == "failed" {
			sum.runFail++
			if series[day] != nil {
				series[day].runFail++
			}
		}
	}

	points := make([]response.AnalyticsAIEffectSeriesPointResponse, 0, len(dayList))
	for _, day := range dayList {
		b := series[day]
		points = append(points, response.AnalyticsAIEffectSeriesPointResponse{
			Date:               day,
			AIConversations:    b.ai,
			Handoffs:           b.handoffs,
			AIResolved:         b.resolved,
			KnowledgeRetrieves: b.retrieve,
			KnowledgeFails:     b.fail,
			AgentRuns:          b.runs,
			AgentRunFails:      b.runFail,
		})
	}

	return response.AnalyticsAIEffectResponse{
		Range:       analyticsRangeResponse(label, start, end, days),
		GeneratedAt: time.Now().Format("2006-01-02 15:04:05"),
		Summary: response.AnalyticsAIEffectSummaryResponse{
			AIConversations:     sum.ai,
			Handoffs:            sum.handoffs,
			HandoffRate:         calcRate(sum.handoffs, sum.ai),
			AIResolved:          sum.resolved,
			AIResolvedRate:      calcRate(sum.resolved, sum.ai),
			KnowledgeRetrieves:  sum.retrieve,
			KnowledgeFails:      sum.fail,
			KnowledgeFailRate:   calcRate(sum.fail, sum.retrieve),
			AgentRuns:           sum.runs,
			AgentRunFails:       sum.runFail,
			AgentRunSuccessRate: calcSuccessRate(sum.runs, sum.runFail),
		},
		Series: points,
	}
}

func (s *analyticsService) GetTickets(rangeValue, from, to, statusFilter, channelFilter, locale string) response.AnalyticsTicketResponse {
	label, start, end, days := normalizeAnalyticsRange(rangeValue, from, to)
	locale = i18nx.NormalizeLocale(locale)
	db := sqls.DB()
	rows := repositories.AnalyticsRepository.ListTicketAnalytics(db, start, end, strings.TrimSpace(statusFilter), strings.TrimSpace(channelFilter))

	dayList := buildAnalyticsDayList(start, end)
	statusCounts := make(map[string]int64, len(enums.TicketStatusValues))
	for _, st := range enums.TicketStatusValues {
		statusCounts[string(st)] = 0
	}
	channelCounts := make(map[string]int64)
	createdByDay := make(map[string]int64, len(dayList))
	doneByDay := make(map[string]int64, len(dayList))
	for _, day := range dayList {
		createdByDay[day] = 0
		doneByDay[day] = 0
	}

	var total int64
	var handleSumMinutes float64
	var handleCount int64
	for _, row := range rows {
		total++
		statusCounts[row.Status]++
		if day := row.CreatedAt.Format("2006-01-02"); dayInBuckets(createdByDay, day) {
			createdByDay[day]++
		}
		if row.HandledAt != nil {
			if day := row.HandledAt.Format("2006-01-02"); dayInBuckets(doneByDay, day) {
				doneByDay[day]++
			}
			handleSumMinutes += row.HandledAt.Sub(row.CreatedAt).Minutes()
			handleCount++
		}
		if ch := strings.TrimSpace(row.Channel); ch != "" {
			channelCounts[ch]++
		}
	}

	statusDistribution := make([]response.AnalyticsStatusCountResponse, 0, len(enums.TicketStatusValues))
	for _, st := range enums.TicketStatusValues {
		statusDistribution = append(statusDistribution, response.AnalyticsStatusCountResponse{
			Status: string(st),
			Label:  ticketStatusLabel(st, locale),
			Count:  statusCounts[string(st)],
		})
	}

	byChannel := make([]response.AnalyticsNameCountResponse, 0, len(channelCounts))
	for key, count := range channelCounts {
		byChannel = append(byChannel, response.AnalyticsNameCountResponse{Key: key, Label: key, Count: count})
	}
	sort.Slice(byChannel, func(i, j int) bool {
		if byChannel[i].Count == byChannel[j].Count {
			return byChannel[i].Key < byChannel[j].Key
		}
		return byChannel[i].Count > byChannel[j].Count
	})
	if len(byChannel) > 10 {
		byChannel = byChannel[:10]
	}

	trend := make([]response.AnalyticsTicketTrendPointResponse, 0, len(dayList))
	for _, day := range dayList {
		trend = append(trend, response.AnalyticsTicketTrendPointResponse{
			Date:    day,
			Created: createdByDay[day],
			Done:    doneByDay[day],
		})
	}

	avgHandleMinutes := 0.0
	if handleCount > 0 {
		avgHandleMinutes = float64(int(handleSumMinutes/float64(handleCount)*10+0.5)) / 10
	}

	return response.AnalyticsTicketResponse{
		Range:       analyticsRangeResponse(label, start, end, days),
		GeneratedAt: time.Now().Format("2006-01-02 15:04:05"),
		Summary: response.AnalyticsTicketSummaryResponse{
			Total:            total,
			Pending:          statusCounts[string(enums.TicketStatusPending)],
			InProgress:       statusCounts[string(enums.TicketStatusInProgress)],
			Done:             statusCounts[string(enums.TicketStatusDone)],
			AvgHandleMinutes: avgHandleMinutes,
		},
		StatusDistribution: statusDistribution,
		ByChannel:          byChannel,
		Trend:              trend,
	}
}

func dayInBuckets(buckets map[string]int64, day string) bool {
	_, ok := buckets[day]
	return ok
}

func ticketStatusLabel(status enums.TicketStatus, locale string) string {
	if i18nx.NormalizeLocale(locale) == i18nx.LocaleEnUS {
		switch status {
		case enums.TicketStatusPending:
			return "Pending"
		case enums.TicketStatusInProgress:
			return "In progress"
		case enums.TicketStatusDone:
			return "Done"
		}
	}
	switch status {
	case enums.TicketStatusPending:
		return "待处理"
	case enums.TicketStatusInProgress:
		return "处理中"
	case enums.TicketStatusDone:
		return "已处理"
	}
	return string(status)
}

func formatInt64(value int64) string {
	return strconv.FormatInt(value, 10)
}

func (s *analyticsService) ExportAIEffectCSV(rangeValue, from, to string) []byte {
	resp := s.GetAIEffect(rangeValue, from, to)
	var buf bytes.Buffer
	buf.Write(analyticsUTF8BOM)
	writer := csv.NewWriter(&buf)
	_ = writer.Write([]string{"Date", "AI Conversations", "Handoffs", "AI Resolved", "Knowledge Retrieves", "Knowledge Fails", "Agent Runs", "Agent Run Fails"})
	for _, p := range resp.Series {
		_ = writer.Write([]string{
			p.Date,
			formatInt64(p.AIConversations),
			formatInt64(p.Handoffs),
			formatInt64(p.AIResolved),
			formatInt64(p.KnowledgeRetrieves),
			formatInt64(p.KnowledgeFails),
			formatInt64(p.AgentRuns),
			formatInt64(p.AgentRunFails),
		})
	}
	writer.Flush()
	return buf.Bytes()
}

func (s *analyticsService) ExportTicketCSV(rangeValue, from, to, statusFilter, channelFilter, locale string) []byte {
	resp := s.GetTickets(rangeValue, from, to, statusFilter, channelFilter, locale)
	var buf bytes.Buffer
	buf.Write(analyticsUTF8BOM)
	writer := csv.NewWriter(&buf)
	_ = writer.Write([]string{"Date", "Created", "Done"})
	for _, p := range resp.Trend {
		_ = writer.Write([]string{p.Date, formatInt64(p.Created), formatInt64(p.Done)})
	}
	writer.Flush()
	return buf.Bytes()
}
