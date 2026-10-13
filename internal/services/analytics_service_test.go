package services

import (
	"testing"

	"cs-agent/internal/pkg/enums"
)

func TestNormalizeAnalyticsRange(t *testing.T) {
	label, start, end, days := normalizeAnalyticsRange("30d", "", "")
	if label != "30d" || days != 30 {
		t.Fatalf("30d -> label=%q days=%d", label, days)
	}
	if end.Sub(start).Hours() != 24*30 {
		t.Fatalf("30d window = %v", end.Sub(start))
	}

	label, _, _, days = normalizeAnalyticsRange("today", "", "")
	if label != "today" || days != 1 {
		t.Fatalf("today -> label=%q days=%d", label, days)
	}

	label, start, end, days = normalizeAnalyticsRange("custom", "2026-01-01", "2026-01-10")
	if label != "custom" || days != 10 {
		t.Fatalf("custom -> label=%q days=%d", label, days)
	}
	if start.Format("2006-01-02") != "2026-01-01" {
		t.Fatalf("custom start = %s", start.Format("2006-01-02"))
	}
	if end.Format("2006-01-02") != "2026-01-11" {
		t.Fatalf("custom end (exclusive) = %s", end.Format("2006-01-02"))
	}

	label, _, _, days = normalizeAnalyticsRange("custom", "bad", "2026-01-10")
	if label != "7d" || days != 7 {
		t.Fatalf("invalid custom should fall back to 7d, got label=%q days=%d", label, days)
	}

	label, _, _, days = normalizeAnalyticsRange("", "", "")
	if label != "7d" || days != 7 {
		t.Fatalf("default -> label=%q days=%d", label, days)
	}
}

func TestCalcSuccessRate(t *testing.T) {
	if got := calcSuccessRate(10, 2); got != 80 {
		t.Fatalf("calcSuccessRate(10,2) = %v, want 80", got)
	}
	if got := calcSuccessRate(0, 0); got != 0 {
		t.Fatalf("calcSuccessRate(0,0) = %v, want 0", got)
	}
	if got := calcSuccessRate(3, 3); got != 0 {
		t.Fatalf("calcSuccessRate(3,3) = %v, want 0", got)
	}
}

func TestTicketStatusLabel(t *testing.T) {
	if got := ticketStatusLabel(enums.TicketStatusDone, "en-US"); got != "Done" {
		t.Fatalf("en label = %q", got)
	}
	if got := ticketStatusLabel(enums.TicketStatusPending, "zh-CN"); got != "待处理" {
		t.Fatalf("zh label = %q", got)
	}
}
