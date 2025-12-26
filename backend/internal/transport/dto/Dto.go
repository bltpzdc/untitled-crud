package dto

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type MetadataWithId struct {
	Id       int      `json:"id"`
	Metadata Metadata `json:"metadata"`
}
type Metadata struct {
	Timestamp    string   `json:"timestamp"`
	FailureCount int      `json:"failureCount"`
	Tags         []string `json:"tags"`
}

type RunDetailsWithId struct {
	Id      int                               `json:"id"`
	Crashes []CrashesGroupedByFailedOperation `json:"crashes"`
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

type StoreFuzzerRunRequest struct {
	ID           int
	Timestamp    time.Time
	FailureCount int
	Tags         []string
	OpCrashes    []CrashesGroupedByFailedOperation
}

type Tag struct {
	ID   int
	Name string
}

type CrashesGroupedByFailedOperation struct {
	ID        int
	RunID     int
	Operation string
	TestCases []TestCase
}

type TestCase struct {
	ID              int
	CrashID         int
	TotalOperations int
	Test            pgtype.Text
	FSSummaries     []FsTestSummary
}

type FsTestSummary struct {
	ID              int
	TestCaseID      int
	FsName          string
	FsSuccessCount  int
	FsFailureCount  int
	FsExecutionTime pgtype.Interval
	FsTrace         pgtype.Text
}
