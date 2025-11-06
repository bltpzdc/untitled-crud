package repository

import (
	"context"
	"errors"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type ArrayRepository struct {
	AnalyzerExecutions []model.AnalyzerExecution
}

func (arrayRepository ArrayRepository) SaveAnalyzerExecution(ctx context.Context, execution model.AnalyzerExecution) (int, error) {
	arrayRepository.AnalyzerExecutions = append(arrayRepository.AnalyzerExecutions, execution)
	return len(arrayRepository.AnalyzerExecutions), nil
}

func (arrayRepository ArrayRepository) ListAnalyzerExecutions(ctx context.Context) ([]model.AnalyzerExecutionBriefView, error) {
	result := make([]model.AnalyzerExecutionBriefView, 0)
	for idx, analyzerExecution := range arrayRepository.AnalyzerExecutions {
		result = append(result, model.AnalyzerExecutionBriefView{Id: idx, Meta: analyzerExecution.Metadata})
	}
	return result, nil
}

func (arrayRepository ArrayRepository) GetAnalyzerExecution(ctx context.Context, executionId int) (model.AnalyzerExecution, error) {
	if 0 < executionId && executionId < len(arrayRepository.AnalyzerExecutions) {
		return arrayRepository.AnalyzerExecutions[executionId], nil
	} else {
		return model.AnalyzerExecution{}, errors.New("not found")
	}
}
