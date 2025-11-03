package repository

import (
	"context"
	"model"
)

type Repository interface {
	SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)

	// Fuzzer runs
    StoreRun(ctx context.Context, run *model.FuzzerRun) error
    GetRun(ctx context.Context, id int) (*model.FuzzerRun, error)
    GetRuns(ctx context.Context, filter RunFilter) ([]model.FuzzerRun, error)

    // tags
    GetOrStoreTag(ctx context.Context, name string) (*model.Tag, error)
    AddTagToRun(ctx context.Context, runID int, tagName string) error
    GetRunTags(ctx context.Context, runID int) ([]string, error)
    GetRunsByTag(ctx context.Context, tagName string) ([]model.FuzzerRun, error)

    // Crashes related to fuzzer run
    StoreCrash(ctx context.Context, crash *model.OpCrash) error
    StoreTestCase(ctx context.Context, testCase *model.TestCase) error
    StoreFsSummary(ctx context.Context, summary *model.FsTestSummary) error
    StoreTestArtifact(ctx context.Context, artifact *model.TestArtifact) error
    StoreFsArtifact(ctx context.Context, artifact *model.FsArtifact) error

    GetRunWithDetails(ctx context.Context, runID int) (*RunDetails, error)
    GetRunStats(ctx context.Context) ([]RunStats, error)
	GetRunsFilteredByDate(ctx context.Context, runFilter RunDateFilter) ([]model.FuzzerRun, error)
}
