package dashboard

import (
	"encoding/json"

	"cs-agent/internal/pkg/constants"
	"cs-agent/internal/pkg/errorsx"
	"cs-agent/internal/pkg/httpx"
	"cs-agent/internal/pkg/httpx/params"
	"cs-agent/internal/pkg/i18nx"
	"cs-agent/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/mlogclub/simple/web"
)

func SupportConfigGetConfig(ctx *gin.Context) {
	if _, err := services.AuthService.RequirePermission(ctx, constants.PermissionSupportConfigView); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	httpx.WriteJSON(ctx, services.SystemConfigService.GetDashboardSupportConfig())
}

func SupportConfigPostSave(ctx *gin.Context) {
	operator, err := services.AuthService.RequirePermission(ctx, constants.PermissionSupportConfigUpdate)
	if err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	req := map[string]json.RawMessage{}
	if err := params.ReadJSON(ctx, &req); err != nil {
		httpx.WriteJSON(ctx, err)
		return
	}
	config, err := services.SystemConfigService.SaveSupportConfig(req, operator)
	if err != nil {
		if validationErr, ok := err.(*services.SystemConfigValidationError); ok {
			locale := i18nx.Locale(ctx)
			httpx.WriteJSON(ctx, web.JsonErrorData(errorsx.CodeInvalidParam, validationErr.Message(locale), gin.H{
				"errors": validationErr.FieldErrorsLocale(locale),
			}))
			return
		}
		httpx.WriteJSON(ctx, err)
		return
	}
	httpx.WriteJSON(ctx, config)
}
