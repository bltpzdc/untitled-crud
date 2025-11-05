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

type FuzzerRunData struct {
    Timestamp    time.Time
    FailureCount int
    Tags         []string
    Crashes      []CrashData
}

type CrashData struct {
    DirName   string
    Operation string
    TestCases []TestCaseData
}

type TestCaseData struct {
    DirName         string
    TotalOperations int
    FsSummaries     map[string]FsSummary
    // test artifacts
    TestOpsSeq      pgtype.JSONB
    Reason          string
    Metadata        pgtype.JSONB
    FsArtifacts     map[string]FsArtifactData
}

type FsSummaryData struct {
    SuccessCount  int
    FailureCount  int
    ExecutionTime pgtype.Interval
}

type FsArtifactData struct {
    Stderr string
    Stdout string
    Trace  pgtype.JSONB
}