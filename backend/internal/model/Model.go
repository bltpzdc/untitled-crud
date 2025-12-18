// Package model contains the data model (the business logic objects)
package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Metadata struct {
	Timestamp    string   `json:"timestamp"`
	FailureCount int      `json:"failureCount"`
	Tags         []string `json:"tags"`
}

type FsOperation struct {
	Type   string
	Params map[string]any
}

type FuzzerRun struct {
	ID                              int                               `db:"id"`
	Timestamp                       string                            `db:"timestamp"`
	FailureCount                    int                               `db:"failure_count"`
	Tags                            []string                          `db:"-"`
	CrashesGroupedByFailedOperation []CrashesGroupedByFailedOperation `db:"-"`
}

type Tag struct {
	ID   int    `db:"id"`
	Name string `db:"name"`
}

type CrashesGroupedByFailedOperation struct {
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
	FsTrace         pgtype.Text     `db:"fs_trace"`
}
