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

// db related model

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
    DirName   string     `db:"dir_name"`
    Operation string     `db:"operation"`
    TestCases []TestCase `db:"-"`
}

type TestCase struct {
    ID              int             `db:"id"`
    CrashID         int             `db:"crash_id"`
    DirName         string          `db:"dir_name"`
    TotalOperations int             `db:"total_operations"`
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