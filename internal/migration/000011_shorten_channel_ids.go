package migration

import (
	"errors"
	"strings"
	"time"

	"cs-agent/internal/models"
	"cs-agent/internal/pkg/constants"
	"cs-agent/internal/pkg/enums"
	"cs-agent/internal/pkg/utils"

	"github.com/mlogclub/simple/sqls"
	"gorm.io/gorm"
)

// shortenChannelIDs rewrites legacy UUID-shaped channel identifiers (32 chars)
// to short URL-safe codes, so public chat links stay short. It is idempotent:
// channels that already carry a short id are skipped.
func init() {
	register(11, "shorten channel ids", func() error {
		db := sqls.DB()
		var channels []models.Channel
		if err := db.Where("status <> ?", enums.StatusDeleted).Find(&channels).Error; err != nil {
			return err
		}
		now := time.Now()
		for _, channel := range channels {
			current := strings.TrimSpace(channel.ChannelID)
			if current == "" || len(current) <= 16 {
				continue
			}
			code, err := uniqueShortChannelID(db, channel.ID)
			if err != nil {
				return err
			}
			if err := db.Model(&models.Channel{}).Where("id = ?", channel.ID).Updates(map[string]any{
				"channel_id":       code,
				"update_user_id":   constants.SystemAuditUserID,
				"update_user_name": constants.SystemAuditUserName,
				"updated_at":       now,
			}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func uniqueShortChannelID(db *gorm.DB, excludeID int64) (string, error) {
	for attempt := 0; attempt < 20; attempt++ {
		code, err := utils.GenerateShortCode(8)
		if err != nil {
			return "", err
		}
		var count int64
		if err := db.Model(&models.Channel{}).
			Where("channel_id = ? AND id <> ? AND status <> ?", code, excludeID, enums.StatusDeleted).
			Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return code, nil
		}
	}
	return "", errors.New("failed to generate a unique short channel id")
}
