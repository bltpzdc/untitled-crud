package repository

import (
	"context"
	"model"
    "db"
)

type Repository interface {
    // TODO - remove deprecated methods later
	SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)

    CreateRun(ctx context.Context, run *FuzzerRun) error
    GetRun(ctx context.Context, id int) (*FuzzerRun, error)
    GetRuns(ctx context.Context) ([]FuzzerRun, error)
    GetAllTags(ctx context.Context) ([]Tag, error)
}
}
