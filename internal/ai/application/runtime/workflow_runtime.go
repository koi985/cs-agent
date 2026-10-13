package runtime

import (
	"encoding/json"

	"cs-agent/internal/ai/workflow/dsl"
	"cs-agent/internal/pkg/enums"
	"cs-agent/internal/pkg/errorsx"
	"cs-agent/internal/repositories"

	"github.com/mlogclub/simple/sqls"
)

type resolvedWorkflow struct {
	Definition dsl.Definition
	WorkflowID int64
	VersionID  int64
}

func resolveWorkflowVersion(workflowVersionID int64) (resolvedWorkflow, error) {
	if workflowVersionID <= 0 {
		return resolvedWorkflow{}, errorsx.InvalidParam("workflow version is required")
	}
	version := repositories.AIWorkflowVersionRepository.Get(sqls.DB(), workflowVersionID)
	if version == nil || version.Status != enums.StatusOk {
		return resolvedWorkflow{}, errorsx.InvalidParam("workflow version does not exist")
	}
	var def dsl.Definition
	if err := json.Unmarshal([]byte(version.Definition), &def); err != nil {
		return resolvedWorkflow{}, errorsx.InvalidParam("workflow definition is invalid")
	}
	return resolvedWorkflow{
		Definition: def,
		WorkflowID: version.WorkflowID,
		VersionID:  version.ID,
	}, nil
}
