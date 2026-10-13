package dashboard

import (
	"net/http"

	"cs-agent/internal/pkg/constants"
	"cs-agent/internal/pkg/httpx"
	"cs-agent/internal/pkg/i18nx"
	"cs-agent/internal/services"

	"cs-agent/internal/pkg/httpx/params"

	"github.com/gin-gonic/gin"
)

func AnalyticsGetAIEffect(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionConversationView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	rangeValue, _ := params.Get(ctx, "range")
	from, _ := params.Get(ctx, "from")
	to, _ := params.Get(ctx, "to")
	httpx.WriteJSON(ctx, services.AnalyticsService.GetAIEffect(rangeValue, from, to))
}

func AnalyticsGetTickets(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionConversationView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	rangeValue, _ := params.Get(ctx, "range")
	from, _ := params.Get(ctx, "from")
	to, _ := params.Get(ctx, "to")
	status, _ := params.Get(ctx, "status")
	channel, _ := params.Get(ctx, "channel")
	httpx.WriteJSON(ctx, services.AnalyticsService.GetTickets(rangeValue, from, to, status, channel, i18nx.Locale(ctx)))
}

func AnalyticsGetAIEffectExport(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionConversationView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	rangeValue, _ := params.Get(ctx, "range")
	from, _ := params.Get(ctx, "from")
	to, _ := params.Get(ctx, "to")
	writeAnalyticsCSV(ctx, "ai-effect.csv", services.AnalyticsService.ExportAIEffectCSV(rangeValue, from, to))
}

func AnalyticsGetTicketExport(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionConversationView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	rangeValue, _ := params.Get(ctx, "range")
	from, _ := params.Get(ctx, "from")
	to, _ := params.Get(ctx, "to")
	status, _ := params.Get(ctx, "status")
	channel, _ := params.Get(ctx, "channel")
	writeAnalyticsCSV(ctx, "tickets.csv", services.AnalyticsService.ExportTicketCSV(rangeValue, from, to, status, channel, i18nx.Locale(ctx)))
}

func writeAnalyticsCSV(ctx *gin.Context, filename string, data []byte) {
	ctx.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	ctx.Data(http.StatusOK, "text/csv; charset=utf-8", data)
}
