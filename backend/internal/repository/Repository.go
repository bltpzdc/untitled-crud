package repository

import (
	"context"
    "time"
    "github.com/jackc/pgx/v5/pgtype"

    "github.com/metametamoon/untitled-crud/backend/internal/model"
)

type FuzzerRun struct {
    ID           int       `db:"id"`
    Timestamp    time.Time `db:"timestamp"`
    FailureCount int       `db:"failure_count"`
    Tags         []string  `db:"-"`
    OpCrashes    []OpCrash `db:"-"`
}

type Tag struct {
    ID   int    `db:"id"`
    Name string `db:"name"`
}

type OpCrash struct {
    ID        int        `db:"id"`
    RunID     int        `db:"run_id"`
    Operation string     `db:"operation"`
    TestCases []TestCase `db:"-"`
}

type TestCase struct {
    ID              int             `db:"id"`
    CrashID         int             `db:"crash_id"`
    TotalOperations int             `db:"total_operations"`
    Test            pgtype.Text     `db:"test"`
    Diff            pgtype.Text     `db:"diff"`
    FSSummaries     []FsTestSummary `db:"-"`
}

type FsTestSummary struct {
    ID              int             `db:"id"`
    TestCaseID      int             `db:"test_case_id"`
    FsName          string          `db:"fs_name"`
    FsSuccessCount  int             `db:"fs_success_count"`
    FsFailureCount  int             `db:"fs_failure_count"`
    FsExecutionTime pgtype.Interval `db:"fs_execution_time"`
}

type Repository interface {
    // TODO - remove deprecated methods later
	SaveAnalyzerExecution(ctx context.Context, exSecution model.AnalyzerExecution) (int, error)
	ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error)
	GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error)

    CreateRun(ctx context.Context, run *FuzzerRun) error
    GetRun(ctx context.Context, id int) (*FuzzerRun, error)
    GetRuns(ctx context.Context) ([]FuzzerRun, error)
    GetAllTags(ctx context.Context) ([]Tag, error)
}
