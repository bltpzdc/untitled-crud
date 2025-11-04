package model

import (
	"fmt"
    "time"
    "github.com/jackc/pgx/v5/pgtype"
)

var ErrAnalyzerExecutionNotFound = fmt.Errorf("analyzer execution not found")

type Metadata struct {
	DateSent string
}

type AnalyzerExecution struct {
	Id             int
	Metadata       Metadata
	LogFile        string
	FoundTests     []Test
	ZipArchivePath string
}

type FsOperation struct {
	Type   string
	Params map[string]any
}

type FsOperationResult interface{}

type Test struct {
	TestContent []FsOperation
	Executions  []FileSystemExecution
}

type FileSystemExecution struct {
	FileSystem      string
	ExecutionResult []FsOperationResult
}

type AnalyzerExecutionBriefView struct {
	Id   int
	Meta Metadata
}


// DB related model

type FuzzerRun struct {
    ID           int       `db:"id"`
    Timestamp    time.Time `db:"timestamp"`
    FailureCount int       `db:"failure_count"`
    Tags         []Tag     `db:"-"` // not in DB
}

type Tag struct {
    ID   int    `db:"id"`
    Name string `db:"name"`
}

type RunTag struct {
    ID        int       `db:"id"`
    RunID     int       `db:"run_id"`
    TagID     int       `db:"tag_id"`
}

type OpCrash struct {
    ID        int    `db:"id"`
    RunID     int    `db:"run_id"`
    DirName   string `db:"dir_name"`
    Operation string `db:"operation"`
}

type TestCase struct {
    ID              int    `db:"id"`
    CrashID         int    `db:"crash_id"`
    DirName         string `db:"dir_name"`
    TotalOperations int    `db:"total_operations"`
}

type FsTestSummary struct {
    ID              int             `db:"id"`
    TestCaseID      int             `db:"test_case_id"`
    FsName          string          `db:"fs_name"`
    FsSuccessCount  int             `db:"fs_success_count"`
    FsFailureCount  int             `db:"fs_failure_count"`
    FsExecutionTime pgtype.Interval `db:"fs_execution_time"`
}

type TestArtifact struct {
    ID         int          `db:"id"`
    TestCaseID int          `db:"test_case_id"`
    TestOpsSeq pgtype.JSONB `db:"test_ops_seq"`
    Reason     string       `db:"reason"`
    Metadata   pgtype.JSONB `db:"metadata"`
}

type FsArtifact struct {
    ID              int          `db:"id"`
    TestArtifactsID int          `db:"test_artifacts_id"`
    FsName          string       `db:"fs_name"`
    FsStderr        string       `db:"fs_stderr"`
    FsStdout        string       `db:"fs_stdout"`
    FsTrace         pgtype.JSONB `db:"fs_trace"`
}

type RunDateFilter struct {
    StartDate    time.Time
    EndDate      time.Time
}

type RunDetails struct {
    Run     *model.FuzzerRun
    Tags    []string
    Crashes []model.OpCrash
}

type RunStats struct {
    RunID        int       `db:"run_id"`
    Timestamp    time.Time `db:"timestamp"`
    // not implemented yet
}