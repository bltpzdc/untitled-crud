package repository

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5"
)

type FuzzerRun struct {
    ID           int       `db:"id"`
    Timestamp    time.Time `db:"timestamp"`
    FailureCount int       `db:"failure_count"`
}

type Tag struct {
    ID   int    `db:"id"`
    Name string `db:"name"`
}

type RunTag struct {
    ID        int `db:"id"`
    RunID     int `db:"run_id"`
    TagID     int `db:"tag_id"`
}

type OpCrash struct {
    ID        int    `db:"id"`
    RunID     int    `db:"run_id"`
    DirName   string `db:"dir_name"`
    Operation string `db:"operation"`
}

type TestCase struct {
    ID              int    `db:"id"`
    CrashID         int    `db:"crash_id"`
    DirName         string `db:"dir_name"`
    TotalOperations int    `db:"total_operations"`
}

type FsTestSummary struct {
    ID              int             `db:"id"`
    TestCaseID      int             `db:"test_case_id"`
    FsName          string          `db:"fs_name"`
    FsSuccessCount  int             `db:"fs_success_count"`
    FsFailureCount  int             `db:"fs_failure_count"`
    FsExecutionTime pgtype.Interval `db:"fs_execution_time"`
}

type TestArtifact struct {
    ID         int          `db:"id"`
    TestCaseID int          `db:"test_case_id"`
    TestOpsSeq pgtype.JSONB `db:"test_ops_seq"`
    Reason     string       `db:"reason"`
    Metadata   pgtype.JSONB `db:"metadata"`
}

type FsArtifact struct {
    ID              int          `db:"id"`
    TestArtifactsID int          `db:"test_artifacts_id"`
    FsName          string       `db:"fs_name"`
    FsStderr        string       `db:"fs_stderr"`
    FsStdout        string       `db:"fs_stdout"`
    FsTrace         pgtype.JSONB `db:"fs_trace"`
}

type FuzzTraceRepository struct {
    db *pgx.Conn
}

func NewFuzzTraceRepository(db *pgx.Conn) *FuzzTraceRepository {
    return &FuzzTraceRepository{db: db}
}

func (r *FuzzTraceRepository) StoreRun(ctx context.Context, run *FuzzerRun) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fuzzer_runs (timestamp, failure_count)
        VALUES ($1, $2)
        RETURNING id
    `, run.Timestamp, run.FailureCount).Scan(&run.ID)
    
    return err
}

func (r *FuzzTraceRepository) GetRun(ctx context.Context, id int) (*FuzzerRun, error) {
    var run FuzzerRun
    err := r.db.QueryRow(ctx, `
        SELECT id, timestamp, failure_count
        FROM fuzzer_runs WHERE id = $1
    `, id).Scan(&run.ID, &run.Timestamp, &run.FailureCount)
    
    if err != nil {
        return nil, err
    }

    return &run, nil
}

func (r *FuzzTraceRepository) GetRuns(ctx context.Context, limit, offset int) ([]FuzzerRun, error) {
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

    var runs []FuzzerRun
    for rows.Next() {
        var run FuzzerRun
        err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount)
        if err != nil {
            return nil, err
        }
        runs = append(runs, run)
    }
    
    return runs, nil
}

func (r *FuzzTraceRepository) GetOrStoreTag(ctx context.Context, name string) (*Tag, error) {
    var tag Tag
    
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

func (r *FuzzTraceRepository) AddTagToRun(ctx context.Context, runID int, tagName string) error {
    tag, err := r.GetOrStoreTag(ctx, tagName)
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

func (r *FuzzTraceRepository) GetRunTags(ctx context.Context, runID int) ([]string, error) {
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

func (r *FuzzTraceRepository) GetRunsByTag(ctx context.Context, tagName string) ([]FuzzerRun, error) {
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

    var runs []FuzzerRun
    for rows.Next() {
        var run FuzzerRun
        err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount)
        if err != nil {
            return nil, err
        }
        runs = append(runs, run)
    }
    
    return runs, nil
}

func (r *FuzzTraceRepository) StoreCrash(ctx context.Context, crash *OpCrash) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO op_crashes (run_id, dir_name, operation)
        VALUES ($1, $2, $3)
        RETURNING id
    `, crash.RunID, crash.DirName, crash.Operation).Scan(&crash.ID)
    
    return err
}

func (r *FuzzTraceRepository) StoreTestCase(ctx context.Context, testCase *TestCase) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO test_cases (crash_id, dir_name, total_operations)
        VALUES ($1, $2, $3)
        RETURNING id
    `, testCase.CrashID, testCase.DirName, testCase.TotalOperations).Scan(&testCase.ID)
    
    return err
}

func (r *FuzzTraceRepository) StoreFsSummary(ctx context.Context, summary *FsTestSummary) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fs_test_summaries 
        (test_case_id, fs_name, fs_success_count, fs_failure_count, fs_execution_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, summary.TestCaseID, summary.FsName, summary.FsSuccessCount, 
        summary.FsFailureCount, summary.FsExecutionTime).Scan(&summary.ID)
    
    return err
}

func (r *FuzzTraceRepository) StoreTestArtifact(ctx context.Context, artifact *TestArtifact) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO test_artifacts (test_case_id, test_ops_seq, reason, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `, artifact.TestCaseID, artifact.TestOpsSeq, artifact.Reason, artifact.Metadata).Scan(&artifact.ID)
    
    return err
}

func (r *FuzzTraceRepository) StoreFsArtifact(ctx context.Context, artifact *FsArtifact) error {
    err := r.db.QueryRow(ctx, `
        INSERT INTO fs_artifacts 
        (test_artifacts_id, fs_name, fs_stderr, fs_stdout, fs_trace)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `, artifact.TestArtifactsID, artifact.FsName, artifact.FsStderr, 
        artifact.FsStdout, artifact.FsTrace).Scan(&artifact.ID)
    
    return err
}
