package repository

import (
    "context"
    "fmt"

    "model"

    "github.com/jackc/pgx/v5"
)

type FuzzerRepository struct {
    db *pgx.Conn
}

func NewFuzzerRepository(db *pgx.Conn) *FuzzerRepository {
    return &FuzzerRepository{db: db}
}

func (r *FuzzerRepository) StoreRun(ctx context.Context, run *model.FuzzerRun) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fuzzer_runs (timestamp, failure_count)
        VALUES ($1, $2)
        RETURNING id
    `, run.Timestamp, run.FailureCount).Scan(&run.ID)
    
    return err
}

func (r *FuzzerRepository) GetRun(ctx context.Context, id int) (*model.FuzzerRun, error) {
    var run model.FuzzerRun
    err := r.db.QueryRow(ctx, `
        SELECT id, timestamp, failure_count
        FROM fuzzer_runs WHERE id = $1
    `, id).Scan(&run.ID, &run.Timestamp, &run.FailureCount)
    
    if err != nil {
        return nil, err
    }

    return &run, nil
}

func (r *FuzzerRepository) GetRuns(ctx context.Context, limit, offset int) ([]model.FuzzerRun, error) {
    rows, err := r.db.Query(ctx, `
        SELECT id, timestamp, failure_count
        FROM fuzzer_runs 
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
    `, limit, offset)
    
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var runs []model.FuzzerRun
    for rows.Next() {
        var run model.FuzzerRun
        err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount)
        if err != nil {
            return nil, err
        }
        runs = append(runs, run)
    }
    
    return runs, nil
}

func (r *FuzzerRepository) GetOrStoreTag(ctx context.Context, name string) (*model.Tag, error) {
    var tag model.Tag
    
    err := r.db.QueryRow(ctx, `
        SELECT id, name FROM tags WHERE name = $1
    `, name).Scan(&tag.ID, &tag.Name)
    
    if err != nil {
        err = r.db.QueryRow(ctx, `
            INSERT INTO tags (name) VALUES ($1) RETURNING id
        `, name).Scan(&tag.ID)
        if err != nil {
            return nil, fmt.Errorf("failed to store tag: %w", err)
        }
        tag.Name = name
    }
    
    return &tag, nil
}

func (r *FuzzerRepository) AddTagToRun(ctx context.Context, runID int, tagName string) error {
    tag, err := r.GetOrCreateTag(ctx, tagName)
    if err != nil {
        return err
    }

    _, err = r.db.Exec(ctx, `
        INSERT INTO run_tags (run_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (run_id, tag_id) DO NOTHING
    `, runID, tag.ID)
    
    return err
}

func (r *FuzzerRepository) GetRunTags(ctx context.Context, runID int) ([]string, error) {
    rows, err := r.db.Query(ctx, `
        SELECT t.name
        FROM tags t
        JOIN run_tags rt ON t.id = rt.tag_id
        WHERE rt.run_id = $1
        ORDER BY t.name
    `, runID)
    
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var tags []string
    for rows.Next() {
        var tagName string
        err := rows.Scan(&tagName)
        if err != nil {
            return nil, err
        }
        tags = append(tags, tagName)
    }
    
    return tags, nil
}

func (r *FuzzerRepository) GetRunsByTag(ctx context.Context, tagName string) ([]model.FuzzerRun, error) {
    rows, err := r.db.Query(ctx, `
        SELECT fr.id, fr.timestamp, fr.failure_count
        FROM fuzzer_runs fr
        JOIN run_tags rt ON fr.id = rt.run_id
        JOIN tags t ON rt.tag_id = t.id
        WHERE t.name = $1
        ORDER BY fr.timestamp DESC
    `, tagName)
    
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var runs []model.FuzzerRun
    for rows.Next() {
        var run model.FuzzerRun
        err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount)
        if err != nil {
            return nil, err
        }
        runs = append(runs, run)
    }
    
    return runs, nil
}

func (r *FuzzerRepository) StoreCrash(ctx context.Context, crash *model.OpCrash) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO op_crashes (run_id, dir_name, operation)
        VALUES ($1, $2, $3)
        RETURNING id
    `, crash.RunID, crash.DirName, crash.Operation).Scan(&crash.ID)
    
    return err
}

func (r *FuzzerRepository) StoreTestCase(ctx context.Context, testCase *model.TestCase) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO test_cases (crash_id, dir_name, total_operations)
        VALUES ($1, $2, $3)
        RETURNING id
    `, testCase.CrashID, testCase.DirName, testCase.TotalOperations).Scan(&testCase.ID)
    
    return err
}

func (r *FuzzerRepository) StoreFsSummary(ctx context.Context, summary *model.FsTestSummary) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fs_test_summaries 
        (test_case_id, fs_name, fs_success_count, fs_failure_count, fs_execution_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, summary.TestCaseID, summary.FsName, summary.FsSuccessCount, 
        summary.FsFailureCount, summary.FsExecutionTime).Scan(&summary.ID)
    
    return err
}

func (r *FuzzerRepository) StoreTestArtifact(ctx context.Context, artifact *model.TestArtifact) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO test_artifacts (test_case_id, test_ops_seq, reason, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `, artifact.TestCaseID, artifact.TestOpsSeq, artifact.Reason, artifact.Metadata).Scan(&artifact.ID)
    
    return err
}

func (r *FuzzerRepository) StoreFsArtifact(ctx context.Context, artifact *model.FsArtifact) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fs_artifacts 
        (test_artifacts_id, fs_name, fs_stderr, fs_stdout, fs_trace)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, artifact.TestArtifactsID, artifact.FsName, artifact.FsStderr, 
        artifact.FsStdout, artifact.FsTrace).Scan(&artifact.ID)
    
    return err
}

func (r *FuzzerRepository) GetRunWithDetails(ctx context.Context, runID int) (*repository.RunDetails, error) {
	run, err := r.GetRun(ctx, runID)
    if err != nil {
        return nil, err
    }

    tags, err := r.GetRunTags(ctx, runID)
    if err != nil {
        return nil, err
    }

    rows, err := r.db.Query(ctx, `
        SELECT id, run_id, dir_name, operation 
        FROM op_crashes WHERE run_id = $1
    `, runID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var crashes []model.OpCrash
    for rows.Next() {
        var crash model.OpCrash
        if err := rows.Scan(&crash.ID, &crash.RunID, &crash.DirName, &crash.Operation); err != nil {
            return nil, err
        }
        crashes = append(crashes, crash)
    }

    return &repository.RunDetails{
        Run:     run,
        Tags:    tags,
        Crashes: crashes,
    }, nil
}

func (r *FuzzerRepository) GetRunStats(ctx context.Context) ([]RunStats, error) {}

func (r *FuzzerRepository) GetRunsFilteredByDate(ctx context.Context, filter repository.RunDateFilter) ([]model.FuzzerRun, error) {
    query := `
        SELECT id, timestamp, failure_count
        FROM fuzzer_runs 
        WHERE 1=1
    `
    args := []interface{}{}
    argPos := 1

    if !filter.StartDate.IsZero() {
        query += fmt.Sprintf(" AND timestamp >= $%d", argPos)
        args = append(args, filter.StartDate)
        argPos++
    }

    if !filter.EndDate.IsZero() {
        query += fmt.Sprintf(" AND timestamp <= $%d", argPos)
        args = append(args, filter.EndDate)
        argPos++
    }

    query += " ORDER BY timestamp DESC"

    rows, err := r.db.Query(ctx, query, args...)
    if err != nil {
        return nil, fmt.Errorf("failed to query runs: %w", err)
    }
    defer rows.Close()

    var runs []model.FuzzerRun
    for rows.Next() {
        var run model.FuzzerRun
        err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount)
        if err != nil {
            return nil, fmt.Errorf("failed to scan run: %w", err)
        }
        runs = append(runs, run)
    }

    return runs, nil
}