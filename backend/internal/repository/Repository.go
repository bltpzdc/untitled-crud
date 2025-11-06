package repository

import (
	"context"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type Repository interface {
	SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)
}
