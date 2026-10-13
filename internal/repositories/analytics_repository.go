package repositories

import (
	"time"

	"cs-agent/internal/models"

	"gorm.io/gorm"
)

var AnalyticsRepository = newAnalyticsRepository()

func newAnalyticsRepository() *analyticsRepository {
	return &analyticsRepository{}
}

type analyticsRepository struct {
}

// ConversationAnalyticsRow is a narrow projection of a conversation used for
// AI-effect aggregation. It intentionally avoids loading the full model.
type ConversationAnalyticsRow struct {
	ServiceMode int        `gorm:"column:service_mode"`
	Status      int        `gorm:"column:status"`
	ChannelID   int64      `gorm:"column:channel_id"`
	HandoffAt   *time.Time `gorm:"column:handoff_at"`
	CreatedAt   time.Time  `gorm:"column:created_at"`
	ClosedAt    *time.Time `gorm:"column:closed_at"`
}

func (r *analyticsRepository) ListConversationAnalytics(db *gorm.DB, startAt, endAt time.Time) []ConversationAnalyticsRow {
	var rows []ConversationAnalyticsRow
	db.Model(&models.Conversation{}).
		Select("service_mode, status, channel_id, handoff_at, created_at, closed_at").
		Where("created_at >= ? AND created_at < ?", startAt, endAt).
		Find(&rows)
	return rows
}

type AgentRunAnalyticsRow struct {
	Status    string    `gorm:"column:status"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (r *analyticsRepository) ListAgentRunAnalytics(db *gorm.DB, startAt, endAt time.Time) []AgentRunAnalyticsRow {
	var rows []AgentRunAnalyticsRow
	db.Model(&models.AgentRun{}).
		Select("status, created_at").
		Where("created_at >= ? AND created_at < ?", startAt, endAt).
		Find(&rows)
	return rows
}

type KnowledgeLogAnalyticsRow struct {
	AnswerStatus int       `gorm:"column:answer_status"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (r *analyticsRepository) ListKnowledgeLogAnalytics(db *gorm.DB, startAt, endAt time.Time) []KnowledgeLogAnalyticsRow {
	var rows []KnowledgeLogAnalyticsRow
	db.Model(&models.KnowledgeRetrieveLog{}).
		Select("answer_status, created_at").
		Where("created_at >= ? AND created_at < ?", startAt, endAt).
		Find(&rows)
	return rows
}

type TicketAnalyticsRow struct {
	Status            string     `gorm:"column:status"`
	Channel           string     `gorm:"column:channel"`
	CurrentAssigneeID int64      `gorm:"column:current_assignee_id"`
	CreatedAt         time.Time  `gorm:"column:created_at"`
	HandledAt         *time.Time `gorm:"column:handled_at"`
}

func (r *analyticsRepository) ListTicketAnalytics(db *gorm.DB, startAt, endAt time.Time, status, channel string) []TicketAnalyticsRow {
	var rows []TicketAnalyticsRow
	tx := db.Model(&models.Ticket{}).
		Select("status, channel, current_assignee_id, created_at, handled_at").
		Where("created_at >= ? AND created_at < ?", startAt, endAt)
	if status != "" {
		tx = tx.Where("status = ?", status)
	}
	if channel != "" {
		tx = tx.Where("channel = ?", channel)
	}
	tx.Find(&rows)
	return rows
}
