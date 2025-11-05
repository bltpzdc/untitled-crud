package service

import (
    "context"
    "fmt"
    "log"
    "time"

    "model"
    "repository"

    "github.com/jackc/pgx/v5/pgtype"
)

type FuzzTraceService struct {
    fuzzerRepo repository.FuzzTraceRepository
}

func NewFuzzTraceService(fuzzerRepo repository.FuzzTraceRepository) *FuzzTraceService {
    return &FuzzTraceService{
        fuzzTraceRepo:  fuzzTraceRepo,
    }
}

func (s *FuzzTraceService) StoreFuzzerResult(ctx context.Context, result *model.FuzzerRunData) error {
    run := &repository.FuzzerRun{
        Timestamp:    result.Timestamp,
        FailureCount: result.FailureCount,
    }
    
    if err := s.fuzzTraceRepo.StoreRun(ctx, run); err != nil {
        return fmt.Errorf("failed to store run: %w", err)
    }

    for _, tagName := range result.Tags {
        if err := s.fuzzTraceRepo.AddTagToRun(ctx, run.ID, tagName); err != nil {
            return fmt.Errorf("failed to add tag %s to run: %w", tagName, err)
        }
    }

    for _, crashData := range result.Crashes {
        crash := &repository.OpCrash{
            RunID:     run.ID,
            DirName:   crashData.DirName,
            Operation: crashData.Operation,
        }
        
        if err := s.fuzzTraceRepo.StoreCrash(ctx, crash); err != nil {
            return fmt.Errorf("failed to store crash: %w", err)
        }

        for _, testCaseData := range crashData.TestCases {
            if err := s.storeTestCase(ctx, crash.ID, testCaseData); err != nil {
                return err
            }
        }
    }

    log.Printf("Successfully stored fuzzer run %d with %d tags and %d crashes", run.ID, len(result.Tags), len(result.Crashes))
    return nil
}

func (s *FuzzTraceService) storeTestCase(ctx context.Context, crashID int, testCaseData *repository.TestCaseData) error {
    testCase := &repository.TestCase{
        CrashID:         crashID,
        DirName:         testCaseData.DirName,
        TotalOperations: testCaseData.TotalOperations,
    }
    
    if err := s.fuzzTraceRepo.StoreTestCase(ctx, testCase); err != nil {
        return fmt.Errorf("failed to store test case: %w", err)
    }

    for fsName, fsSummary := range testCaseData.FsSummaries {
        summary := &repository.FsTestSummary{
            TestCaseID:       testCase.ID,
            FsName:           fsName,
            FsSuccessCount:   fsSummary.SuccessCount,
            FsFailureCount:   fsSummary.FailureCount,
            FsExecutionTime:  fsSummary.ExecutionTime,
        }
        
        if err := s.fuzzTraceRepo.StoreFsSummary(ctx, summary); err != nil {
            return fmt.Errorf("failed to store FS summary: %w", err)
        }
    }

    testArtifact := &repository.TestArtifact{
        TestCaseID: testCase.ID,
        TestOpsSeq: testCaseData.TestOpsSeq,
        Reason:     testCaseData.Reason,
        Metadata:   testCaseData.Metadata,
    }
    
    if err := s.fuzzTraceRepo.StoreTestArtifact(ctx, testArtifact); err != nil {
        return fmt.Errorf("failed to store test artifact: %w", err)
    }

    for fsName, fsArtifact := range testCaseData.FsArtifacts {
        fsArtifact := &repository.FsArtifact{
            TestArtifactsID: testArtifact.ID,
            FsName:          fsName,
            FsStderr:        fsArtifact.Stderr,
            FsStdout:        fsArtifact.Stdout,
            FsTrace:         fsArtifact.Trace,
        }
        
        if err := s.fuzzTraceRepo.StoreFsArtifact(ctx, fsArtifact); err != nil {
            return fmt.Errorf("failed to store FS artifact: %w", err)
        }
    }

    return nil
}

func (s *FuzzTraceService) GetRuns(ctx context.Context, limit, offset int) ([]repository.FuzzerRun, error) {
	runs, err := s.fuzzTraceRepo.GetRuns(ctx, limit, offset)
    if err != nil {
        return nil, err
    }

	for i := range runs {
		tags, err := s.fuzzTraceRepo.GetRunTags(ctx, runs[i].ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get run tags: %w", err)
		}
		runs[i].Tags = tags
	}

	return runs, nil
}

func (s *FuzzTraceService) GetRun(ctx context.Context, runID int) (*repository.FuzzerRun, error) {
    run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
    if err != nil {
        return nil, err
    }

    tags, err := s.fuzzTraceRepo.GetRunTags(ctx, runID)
    if err != nil {
        return nil, fmt.Errorf("failed to get run tags: %w", err)
    }
    run.Tags = tags

	return run, nil
}

func (s *FuzzTraceService) GetRunsByTag(ctx context.Context, tagName string) ([]repository.FuzzerRun, error) {
    runs, err := s.fuzzTraceRepo.GetRunsByTag(ctx, tagName)
    if err != nil {
        return nil, fmt.Errorf("failed to find runs by tag: %w", err)
    }

    for i := range runs {
        tags, err := s.fuzzTraceRepo.GetRunTags(ctx, runs[i].ID)
        if err != nil {
            return nil, fmt.Errorf("failed to get run tags: %w", err)
        }
        runs[i].Tags = tags
    }

    return runs, nil
}