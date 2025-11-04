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

type FuzzerService struct {
    fuzzerRepo repository.FuzzerRepository
}

func NewFuzzerService(fuzzerRepo repository.FuzzerRepository) *FuzzerService {
    return &FuzzerService{
        fuzzerRepo:  fuzzerRepo,
    }
}

type FuzzerResult struct {
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
    // artifacts
    TestOpsSeq      pgtype.JSONB
    Reason          string
    Metadata        pgtype.JSONB
    FsArtifacts     map[string]FsArtifactData
}

type FsSummary struct {
    SuccessCount  int
    FailureCount  int
    ExecutionTime pgtype.Interval
}

type FsArtifactData struct {
    Stderr string
    Stdout string
    Trace  pgtype.JSONB
}

func (s *FuzzerService) StoreFuzzerResult(ctx context.Context, result *FuzzerResult) error {
    run := &model.FuzzerRun{
        Timestamp:    result.Timestamp,
        FailureCount: result.FailureCount,
    }
    
    if err := s.fuzzerRepo.StoreRun(ctx, run); err != nil {
        return fmt.Errorf("failed to store run: %w", err)
    }

    for _, tagName := range result.Tags {
        if err := s.fuzzerRepo.AddTagToRun(ctx, run.ID, tagName); err != nil {
            return fmt.Errorf("failed to add tag %s to run: %w", tagName, err)
        }
    }

    for _, crashData := range result.Crashes {
        crash := &model.OpCrash{
            RunID:     run.ID,
            DirName:   crashData.DirName,
            Operation: crashData.Operation,
        }
        
        if err := s.fuzzerRepo.StoreCrash(ctx, crash); err != nil {
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

func (s *FuzzerService) storeTestCase(ctx context.Context, crashID int, testCaseData TestCaseData) error {
    testCase := &model.TestCase{
        CrashID:         crashID,
        DirName:         testCaseData.DirName,
        TotalOperations: testCaseData.TotalOperations,
    }
    
    if err := s.fuzzerRepo.StoreTestCase(ctx, testCase); err != nil {
        return fmt.Errorf("failed to store test case: %w", err)
    }

    for fsName, fsSummary := range testCaseData.FsSummaries {
        summary := &model.FsTestSummary{
            TestCaseID:       testCase.ID,
            FsName:           fsName,
            FsSuccessCount:   fsSummary.SuccessCount,
            FsFailureCount:   fsSummary.FailureCount,
            FsExecutionTime:  fsSummary.ExecutionTime,
        }
        
        if err := s.fuzzerRepo.StoreFsSummary(ctx, summary); err != nil {
            return fmt.Errorf("failed to store FS summary: %w", err)
        }
    }

    testArtifact := &model.TestArtifact{
        TestCaseID: testCase.ID,
        TestOpsSeq: testCaseData.TestOpsSeq,
        Reason:     testCaseData.Reason,
        Metadata:   testCaseData.Metadata,
    }
    
    if err := s.fuzzerRepo.StoreTestArtifact(ctx, testArtifact); err != nil {
        return fmt.Errorf("failed to store test artifact: %w", err)
    }

    for fsName, fsArtifact := range testCaseData.FsArtifacts {
        fsArtifactModel := &model.FsArtifact{
            TestArtifactsID: testArtifact.ID,
            FsName:          fsName,
            FsStderr:        fsArtifact.Stderr,
            FsStdout:        fsArtifact.Stdout,
            FsTrace:         fsArtifact.Trace,
        }
        
        if err := s.fuzzerRepo.StoreFsArtifact(ctx, fsArtifactModel); err != nil {
            return fmt.Errorf("failed to store FS artifact: %w", err)
        }
    }

    return nil
}

func (s *FuzzerService) GetRuns(ctx context.Context, limit, offset int) ([]model.FuzzerRun, error) {
	runs, err := s.fuzzerRepo.GetRuns(ctx, limit, offset)
    if err != nil {
        return nil, err
    }

	for i := range runs {
		tags, err := s.fuzzerRepo.GetRunTags(ctx, runs[i].ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get run tags: %w", err)
		}
		runs[i].Tags = tags
	}

	return runs, nil
}

func (s *FuzzerService) GetRun(ctx context.Context, runID int) (*model.FuzzerRun, error) {
    run, err := s.fuzzerRepo.GetRun(ctx, runID)
    if err != nil {
        return nil, err
    }

    tags, err := s.fuzzerRepo.GetRunTags(ctx, runID)
    if err != nil {
        return nil, fmt.Errorf("failed to get run tags: %w", err)
    }
    run.Tags = tags

	return run, nil
}

func (s *FuzzerService) GetRunsByTag(ctx context.Context, tagName string) ([]model.FuzzerRun, error) {
    runs, err := s.fuzzerRepo.GetRunsByTag(ctx, tagName)
    if err != nil {
        return nil, fmt.Errorf("failed to find runs by tag: %w", err)
    }

    for i := range runs {
        tags, err := s.fuzzerRepo.GetRunTags(ctx, runs[i].ID)
        if err != nil {
            return nil, fmt.Errorf("failed to get run tags: %w", err)
        }
        runs[i].Tags = tags
    }

    return runs, nil
}