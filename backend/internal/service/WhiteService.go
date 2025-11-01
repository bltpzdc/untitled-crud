package service

import (
	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type WhiteService interface {
	StoreExecution(zipArchivePath string) (int, error)
	GetStoredExecutions() ([]model.AnalyzerExecutionBriefView, error)
	GetExecution(id int) (*model.AnalyzerExecution, error)
	UnloadExecution(id int) error
}
