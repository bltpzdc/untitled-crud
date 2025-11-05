package repository

import (
    "context"
    "encoding/json"
    "github.com/jackc/pgx/v5"

    "github.com/metametamoon/untitled-crud/backend/internal/model"
)

type FuzzTraceRepository struct {
    db *pgx.Conn
}

func NewFuzzTraceRepository(db *pgx.Conn) *FuzzTraceRepository {
    return &FuzzTraceRepository{
        db: db,
    }
}

func (r *FuzzTraceRepository) StoreRun(ctx context.Context, run *model.FuzzerRun) error {
    var runID int
    
    // trying to find run
    if run.ID != 0 {
        err := r.db.QueryRow(ctx,
            "SELECT id FROM fuzzer_runs WHERE id = $1",
            run.ID,
        ).Scan(&runID)
        
        if err != nil && err != pgx.ErrNoRows {
            return err
        }
    }

    if runID == 0 {
        // didn't find the run -> create new
        err := r.db.QueryRow(ctx,
            `INSERT INTO fuzzer_runs (timestamp, failure_count) 
             VALUES ($1, $2) RETURNING id`,
            run.Timestamp, run.FailureCount,
        ).Scan(&runID)
        if err != nil {
            return err
        }
    }

    if err := r.saveRunHierarchy(ctx, runID, run); err != nil {
        return err
    }

    if err := r.addRunTags(ctx, runID, run.Tags); err != nil {
        return err
    }

    run.ID = runID

    return nil
}

func (r *FuzzTraceRepository) GetRun(ctx context.Context, id int) (*model.FuzzerRun, error) {
    var run model.FuzzerRun

    // get requested run
    err := r.db.QueryRow(ctx, `
        SELECT id, timestamp, failure_count
        FROM fuzzer_runs WHERE id = $1
    `, id).Scan(&run.ID, &run.Timestamp, &run.FailureCount)
    
    if err != nil {
        return nil, err
    }

    // get related tags
    tags, err := r.getRunTags(ctx, run.ID)
    if err != nil {
        return nil, err
    }
    run.Tags = tags

    // get related crashes
    opCrashes, err := r.getRunOpCrashes(ctx, run.ID)
    if err != nil {
        return nil, err
    }
    run.OpCrashes = opCrashes

    return &run, nil
}

func (r *FuzzTraceRepository) GetRuns(ctx context.Context) ([]model.FuzzerRun, error) {
    rows, err := r.db.Query(ctx,
        "SELECT id, timestamp, failure_count FROM fuzzer_runs ORDER BY timestamp DESC",
    )
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
        
        tags, err := r.getRunTags(ctx, run.ID)
        if err != nil {
            return nil, err
        }
        run.Tags = tags
        
        opCrashes, err := r.getRunOpCrashes(ctx, run.ID)
        if err != nil {
            return nil, err
        }
        run.OpCrashes = opCrashes
        
        runs = append(runs, run)
    }
    
    return runs, nil
}

func (r *FuzzTraceRepository) GetAllTags(ctx context.Context) ([]model.Tag, error) {
    rows, err := r.db.Query(ctx, "SELECT id, name FROM tags ORDER BY name")
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var tags []model.Tag
    for rows.Next() {
        var tag model.Tag
        if err := rows.Scan(&tag.ID, &tag.Name); err != nil {
            return nil, err
        }
        tags = append(tags, tag)
    }
    
    return tags, nil
}

// private functions

func (r *FuzzTraceRepository) saveRunHierarchy(ctx context.Context, runID int, run *model.FuzzerRun) error {
    // save crashes info
    for i := range run.OpCrashes {
        opCrash := &run.OpCrashes[i]
        opCrash.RunID = runID
        
        err := r.db.QueryRow(ctx,
            `INSERT INTO op_crashes (run_id, operation) 
             VALUES ($1, $2) RETURNING id`,
            opCrash.RunID, opCrash.Operation,
        ).Scan(&opCrash.ID)
        if err != nil {
            return err
        }
        
        // save tests related to crash operation-error code
        for j := range opCrash.TestCases {
            testCase := &opCrash.TestCases[j]
            testCase.CrashID = opCrash.ID
            
            testJSON, _ := json.Marshal(testCase.Test)
            diffJSON, _ := json.Marshal(testCase.Diff)
            
            err := r.db.QueryRow(ctx,
                `INSERT INTO test_cases (crash_id, total_operations, test_seq, diff) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                testCase.CrashID, testCase.TotalOperations, testJSON, diffJSON,
            ).Scan(&testCase.ID)
            if err != nil {
                return err
            }
            
            // save summary related to certain FS
            for k := range testCase.FSSummaries {
                fsSummary := &testCase.FSSummaries[k]
                fsSummary.TestCaseID = testCase.ID
                
                err := r.db.QueryRow(ctx,
                    `INSERT INTO fs_test_summaries (test_case_id, fs_name, fs_success_count, fs_failure_count, fs_execution_time) 
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    fsSummary.TestCaseID, fsSummary.FsName, fsSummary.FsSuccessCount, 
                    fsSummary.FsFailureCount, fsSummary.FsExecutionTime,
                ).Scan(&fsSummary.ID)
                if err != nil {
                    return err
                }
            }
        }
    }
    
    return nil
}

func (r *FuzzTraceRepository) getRunOpCrashes(ctx context.Context, runID int) ([]model.OpCrash, error) {
    rows, err := r.db.Query(ctx,
        "SELECT id, operation FROM op_crashes WHERE run_id = $1",
        runID,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var opCrashes []model.OpCrash
    for rows.Next() {
        var opCrash model.OpCrash
        if err := rows.Scan(&opCrash.ID, &opCrash.Operation); err != nil {
            return nil, err
        }
        
        // get related tests
        testCases, err := r.getOpCrashTestCases(ctx, opCrash.ID)
        if err != nil {
            return nil, err
        }
        opCrash.TestCases = testCases
        
        opCrashes = append(opCrashes, opCrash)
    }
    
    return opCrashes, nil
}

func (r *FuzzTraceRepository) getOpCrashTestCases(ctx context.Context, crashID int) ([]model.TestCase, error) {
    rows, err := r.db.Query(ctx,
        "SELECT id, total_operations, test_seq, diff FROM test_cases WHERE crash_id = $1",
        crashID,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var testCases []model.TestCase
    for rows.Next() {
        var testCase model.TestCase
        var testJSON, diffJSON []byte
        
        if err := rows.Scan(&testCase.ID, &testCase.TotalOperations, &testJSON, &diffJSON); err != nil {
            return nil, err
        }
        
        json.Unmarshal(testJSON, &testCase.Test)
        json.Unmarshal(diffJSON, &testCase.Diff)
        
        // get related summaries
        fsSummaries, err := r.getTestCaseFsSummaries(ctx, testCase.ID)
        if err != nil {
            return nil, err
        }
        testCase.FSSummaries = fsSummaries
        
        testCases = append(testCases, testCase)
    }
    
    return testCases, nil
}

func (r *FuzzTraceRepository) getTestCaseFsSummaries(ctx context.Context, testCaseID int) ([]model.FsTestSummary, error) {
    rows, err := r.db.Query(ctx,
        "SELECT id, fs_name, fs_success_count, fs_failure_count, fs_execution_time FROM fs_test_summaries WHERE test_case_id = $1",
        testCaseID,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var fsSummaries []model.FsTestSummary
    for rows.Next() {
        var fsSummary model.FsTestSummary
        if err := rows.Scan(&fsSummary.ID, &fsSummary.FsName, &fsSummary.FsSuccessCount, 
            &fsSummary.FsFailureCount, &fsSummary.FsExecutionTime); err != nil {
            return nil, err
        }
        fsSummaries = append(fsSummaries, fsSummary)
    }
    
    return fsSummaries, nil
}

func (r *FuzzTraceRepository) getRunTags(ctx context.Context, runID int) ([]string, error) {
    rows, err := r.db.Query(ctx,
        "SELECT t.name FROM tags t JOIN run_tags rt ON t.id = rt.tag_id WHERE rt.run_id = $1",
        runID,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var tags []string
    for rows.Next() {
        var tag string
        if err := rows.Scan(&tag); err != nil {
            return nil, err
        }
        tags = append(tags, tag)
    }
    
    return tags, nil
}

func (r *FuzzTraceRepository) addRunTags(ctx context.Context, runID int, tagNames []string) error {
    currentTags, err := r.getRunTags(ctx, runID)
    if err != nil {
        return err
    }

    // structs for comparision
    currentTagSet := make(map[string]bool)
    for _, tag := range currentTags {
        currentTagSet[tag] = true
    }
    newTagSet := make(map[string]bool)
    for _, tag := range tagNames {
        newTagSet[tag] = true
    }

    // add unexisting tags
    for _, tagName := range tagNames {
        if !currentTagSet[tagName] {
            var tagID int
            err := r.db.QueryRow(ctx,
                "INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
                tagName,
            ).Scan(&tagID)
            
            if err != nil {
                return err
            }
            
            _, err = r.db.Exec(ctx,
                "INSERT INTO run_tags (run_id, tag_id) VALUES ($1, $2) ON CONFLICT (run_id, tag_id) DO NOTHING",
                runID, tagID,
            )
            if err != nil {
                return err
            }
        }
    }

    // delete tags
    for _, currentTag := range currentTags {
        if !newTagSet[currentTag] {
            _, err := r.db.Exec(ctx,
                "DELETE FROM run_tags WHERE run_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)",
                runID, currentTag,
            )
            if err != nil {
                return err
            }
        }
    }
    return nil
}