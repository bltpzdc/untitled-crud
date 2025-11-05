package repository

import (
	"context"
	"model"
    "db"
)

type Repository interface {
	SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)

	// Fuzzer runs
    StoreRun(ctx context.Context, run *FuzzerRun) error
    GetRun(ctx context.Context, id int) (*FuzzerRun, error)
    GetRuns(ctx context.Context, filter RunFilter) ([]FuzzerRun, error)

    // tags
    GetOrStoreTag(ctx context.Context, name string) (*Tag, error)
    AddTagToRun(ctx context.Context, runID int, tagName string) error
    GetRunTags(ctx context.Context, runID int) ([]string, error)
    GetRunsByTag(ctx context.Context, tagName string) ([]FuzzerRun, error)

    // Crashes related to fuzzer run
    StoreCrash(ctx context.Context, crash *OpCrash) error
    StoreTestCase(ctx context.Context, testCase *TestCase) error
    StoreFsSummary(ctx context.Context, summary *FsTestSummary) error
    StoreTestArtifact(ctx context.Context, artifact *TestArtifact) error
    StoreFsArtifact(ctx context.Context, artifact *FsArtifact) error
}
