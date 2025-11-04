package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
	"github.com/metametamoon/untitled-crud/backend/internal/repository"
)

type WhiteService struct {
	repo repository.Repository
}

func NewWhiteService(repo repository.Repository) (*WhiteService, error) {
	if repo == nil {
		return nil, errors.New("repository cannot be nil")
	}

	return &WhiteService{
		repo: repo,
	}, nil
}

func (s *WhiteService) StoreExecution(zipArchivePath string) (int, error) {
	execution, err := ExtractTheAnalyzerExecution(zipArchivePath)
	if err != nil {
		return 0, fmt.Errorf("failed to extract analyzer execution from %s: %w", zipArchivePath, err)
	}

	executionID, err := s.repo.SaveAnalyzerExecution(context.Background(), execution)
	if err != nil {
		return 0, fmt.Errorf("failed to save analyzer execution to repository: %w", err)
	}
	return executionID, nil
}

func (s *WhiteService) GetStoredExecutions() ([]model.AnalyzerExecutionBriefView, error) {
	executions, err := s.repo.ListAnalyzerExecutions(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to list analyzer executions from repository: %w", err)
	}
	return executions, nil
}

func (s *WhiteService) GetExecution(id int) (*model.AnalyzerExecution, error) {
	execution, err := s.repo.GetAnalyzerExecution(context.Background(), id)
	if err != nil {
		if errors.Is(err, model.ErrAnalyzerExecutionNotFound) {
			return nil, fmt.Errorf("execution with Id %d not found: %w", id, err)
		}
		return nil, fmt.Errorf("failed to get analyzer execution %d from repository: %w", id, err)
	}

	return &execution, nil
}
