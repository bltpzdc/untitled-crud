package repository

import (
	"context"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type Repository interface {
    // TODO - remove deprecated methods later
	SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)

    CreateRun(ctx context.Context, run *model.FuzzerRun) error
    GetRun(ctx context.Context, id int) (*model.FuzzerRun, error)
    GetRuns(ctx context.Context) ([]model.FuzzerRun, error)
    GetAllTags(ctx context.Context) ([]model.Tag, error)
}
