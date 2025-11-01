package model

import "fmt"

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
