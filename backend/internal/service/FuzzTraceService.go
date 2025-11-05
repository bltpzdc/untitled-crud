package service

import (
    "context"
    "fmt"
    "log"

    "github.com/metametamoon/untitled-crud/backend/internal/model"
    "github.com/metametamoon/untitled-crud/backend/internal/repository"
)

type FuzzTraceService struct {
    fuzzTraceRepo *repository.FuzzTraceRepository
}

func NewFuzzTraceService(fuzzTraceRepo *repository.FuzzTraceRepository) *FuzzTraceService {
    return &FuzzTraceService{
        fuzzTraceRepo:  fuzzTraceRepo,
    }
}

func (s *FuzzTraceService) StoreFuzzerRun(ctx context.Context, run *model.FuzzerRun) error {    
    if err := s.fuzzTraceRepo.StoreRun(ctx, run); err != nil {
        return fmt.Errorf("failed to store run: %w", err)
    }

    log.Printf("Successfully stored fuzzer run %d with %d tags and %d crashes", run.ID, len(run.Tags), len(run.OpCrashes))
    return nil
}

func (s *FuzzTraceService) GetRuns(ctx context.Context) ([]model.FuzzerRun, error) {
	runs, err := s.fuzzTraceRepo.GetRuns(ctx)
    if err != nil {
        return nil, err
    }

    log.Printf("Successfully got fuzzer runs in the amout of %d", len(runs))
	return runs, nil
}

func (s *FuzzTraceService) GetRun(ctx context.Context, runID int) (*model.FuzzerRun, error) {
    run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
    if err != nil {
        return nil, err
    }

    log.Printf("Successfully got fuzzer run with id %d", runID)
	return run, nil
}

func (s *FuzzTraceService) GetAllTags(ctx context.Context) ([]model.Tag, error) {
    tags, err := s.fuzzTraceRepo.GetAllTags(ctx)
    if err != nil {
        return nil, err
    }

    log.Printf("Successfully got tags in the amout of %d", len(tags))
	return tags, nil
}