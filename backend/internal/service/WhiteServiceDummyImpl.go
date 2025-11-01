package service

import (
	"fmt"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type WhiteServiceDummyImpl struct {
}

func NewDummyWhiteService() *WhiteServiceDummyImpl {
	return &WhiteServiceDummyImpl{}
}

func (w *WhiteServiceDummyImpl) StoreExecution(zipArchivePath string) error {
	fmt.Printf("Storing execution from: %s\n", zipArchivePath)
	return nil
}

func (w *WhiteServiceDummyImpl) GetStoredExecutions() ([]model.AnalyzerExecutionBriefView, error) {
	fmt.Println("Retrieving stored executions")
	return []model.AnalyzerExecutionBriefView{
		{Id: 1, Meta: model.Metadata{DateSent: "2023-10-27T10:00:00Z"}},
		{Id: 2, Meta: model.Metadata{DateSent: "2023-10-27T11:00:00Z"}},
	}, nil
}

func (w *WhiteServiceDummyImpl) GetExecution(id int) (*model.AnalyzerExecution, error) {
	fmt.Printf("Retrieving execution data for Id: %d\n", id)
	if id == 1 {
		return &model.AnalyzerExecution{
			Id: 1,
			Metadata: model.Metadata{
				DateSent: "2023-10-27T10:00:00Z",
			},
			LogFile:        "dummy.log",
			ZipArchivePath: "/path/to/execution/1.zip",
		}, nil
	}
	return nil, fmt.Errorf("execution with Id %d not found", id)
}

func (w *WhiteServiceDummyImpl) LoadExecution(id int) (*model.AnalyzerExecution, error) {
	fmt.Printf("Loading execution for Id: %d\n", id)
	return w.GetExecution(id)
}

func (w *WhiteServiceDummyImpl) UnloadExecution(id int) error {
	fmt.Printf("Unloading execution with Id: %d\n", id)
	return nil
}
