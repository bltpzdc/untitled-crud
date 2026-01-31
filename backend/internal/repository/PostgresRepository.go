package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type FuzzTraceRepository struct {
	db *pgxpool.Pool
}

func NewFuzzTraceRepository(db *pgxpool.Pool) *FuzzTraceRepository {
	return &FuzzTraceRepository{
		db: db,
	}
}

func (r *FuzzTraceRepository) StoreRun(ctx context.Context, run *model.FuzzerRun) error {
	var runID int

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

// returns (nil, nil) if not found
func (r *FuzzTraceRepository) GetRun(ctx context.Context, id int) (*model.FuzzerRun, error) {
	var run model.FuzzerRun

	var comment pgtype.Text
	err := r.db.QueryRow(ctx, `
        SELECT id, timestamp, failure_count, comment
        FROM fuzzer_runs WHERE id = $1
    `, id).Scan(&run.ID, &run.Timestamp, &run.FailureCount, &comment)
	
	if err == nil && comment.Valid {
		commentStr := comment.String
		run.Comment = &commentStr
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
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
	run.CrashesGroupedByFailedOperation = opCrashes

	return &run, nil
}

func (r *FuzzTraceRepository) GetRuns(ctx context.Context) ([]model.FuzzerRun, error) {
	rows, err := r.db.Query(ctx,
		"SELECT id, timestamp, failure_count, comment FROM fuzzer_runs ORDER BY timestamp DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []model.FuzzerRun

	for rows.Next() {
		var run model.FuzzerRun
		var comment pgtype.Text
		err := rows.Scan(&run.ID, &run.Timestamp, &run.FailureCount, &comment)
		if err != nil {
			return nil, err
		}
		if comment.Valid {
			commentStr := comment.String
			run.Comment = &commentStr
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
		run.CrashesGroupedByFailedOperation = opCrashes

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

func (r *FuzzTraceRepository) saveRunHierarchy(ctx context.Context, runID int, run *model.FuzzerRun) error {
	for i := range run.CrashesGroupedByFailedOperation {
		opCrash := &run.CrashesGroupedByFailedOperation[i]
		opCrash.RunID = runID

		// folder_id теперь строка, сохраняем как есть (или NULL)
		var folderID interface{}
		if opCrash.FolderID != nil {
			folderID = *opCrash.FolderID
		}
		err := r.db.QueryRow(ctx,
			`INSERT INTO op_crashes (run_id, operation, folder_id) 
             VALUES ($1, $2, $3) RETURNING id`,
			opCrash.RunID, opCrash.Operation, folderID,
		).Scan(&opCrash.ID)
		if err != nil {
			return err
		}

		for j := range opCrash.TestCases {
			testCase := &opCrash.TestCases[j]
			testCase.CrashID = opCrash.ID

			testJSON, _ := json.Marshal(testCase.Test)

			err := r.db.QueryRow(ctx,
				`INSERT INTO test_cases (crash_id, hash, total_operations, test) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
				testCase.CrashID, testCase.Hash, testCase.TotalOperations, testJSON,
			).Scan(&testCase.ID)
			if err != nil {
				return err
			}

			for k := range testCase.Reasons {
				reason := &testCase.Reasons[k]
				reason.TestCaseID = testCase.ID

				err := r.db.QueryRow(ctx,
					`INSERT INTO test_reasons (test_case_id, op_number, diff) VALUES ($1, $2, $3) RETURNING id`,
					reason.TestCaseID, reason.OpNumber, reason.Diff).Scan(&reason.ID)
				if err != nil {
					return err
				}
			}

			for k := range testCase.FSSummaries {
				fsSummary := &testCase.FSSummaries[k]
				fsSummary.TestCaseID = testCase.ID

				err := r.db.QueryRow(ctx,
					`INSERT INTO fs_test_summaries (test_case_id, fs_name, fs_success_count, fs_failure_count, fs_execution_time, fs_trace, fs_stdout, fs_stderr) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
					fsSummary.TestCaseID, fsSummary.FsName, fsSummary.FsSuccessCount, fsSummary.FsFailureCount, 
					fsSummary.FsExecutionTime, fsSummary.FsTrace, fsSummary.FsStdout, fsSummary.FsStderr,
				).Scan(&fsSummary.ID)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func (r *FuzzTraceRepository) getRunOpCrashes(ctx context.Context, runID int) ([]model.CrashesGroupedByFailedOperation, error) {
	rows, err := r.db.Query(ctx,
		"SELECT id, operation, folder_id FROM op_crashes WHERE run_id = $1",
		runID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var opCrashes []model.CrashesGroupedByFailedOperation
	for rows.Next() {
		var opCrash model.CrashesGroupedByFailedOperation
		if err := rows.Scan(&opCrash.ID, &opCrash.Operation, &opCrash.FolderID); err != nil {
			return nil, err
		}

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
		"SELECT id, hash, total_operations, test FROM test_cases WHERE crash_id = $1",
		crashID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testCases []model.TestCase
	for rows.Next() {
		var testCase model.TestCase
		var testJSON []byte

		if err := rows.Scan(&testCase.ID, &testCase.Hash, &testCase.TotalOperations, &testJSON); err != nil {
			return nil, err
		}

		json.Unmarshal(testJSON, &testCase.Test)

		fsSummaries, err := r.getTestCaseFsSummaries(ctx, testCase.ID)
		if err != nil {
			return nil, err
		}
		testCase.FSSummaries = fsSummaries

		reasons, err := r.getTestCaseReasons(ctx, testCase.ID)
		if err != nil {
			return nil, err
		}
		testCase.Reasons = reasons

		testCases = append(testCases, testCase)
	}

	return testCases, nil
}

func (r *FuzzTraceRepository) getTestCaseReasons(ctx context.Context, testCaseID int) ([]model.TestReason, error) {
	rows, err := r.db.Query(ctx,
		"SELECT id, op_number, diff FROM test_reasons WHERE test_case_id = $1",
		testCaseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reasons []model.TestReason
	for rows.Next() {
		var reason model.TestReason
		if err := rows.Scan(&reason.ID, &reason.OpNumber, &reason.Diff); err != nil {
			return nil, err
		}
		reasons = append(reasons, reason)
	}

	return reasons, nil
}

func (r *FuzzTraceRepository) getTestCaseFsSummaries(ctx context.Context, testCaseID int) ([]model.FsTestSummary, error) {
	rows, err := r.db.Query(ctx,
		"SELECT id, fs_name, fs_success_count, fs_failure_count, fs_execution_time, fs_trace, fs_stdout, fs_stderr FROM fs_test_summaries WHERE test_case_id = $1",
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
			&fsSummary.FsFailureCount, &fsSummary.FsExecutionTime, &fsSummary.FsTrace,
			&fsSummary.FsStdout, &fsSummary.FsStderr); err != nil {
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

func (r *FuzzTraceRepository) UpdateRunTags(ctx context.Context, runID int, tagNames []string) error {
	return r.addRunTags(ctx, runID, tagNames)
}

func (r *FuzzTraceRepository) UpdateRunComment(ctx context.Context, runID int, comment *string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE fuzzer_runs SET comment = $1 WHERE id = $2",
		comment, runID,
	)
	return err
}

func (r *FuzzTraceRepository) DeleteRun(ctx context.Context, runID int) error {
	_, err := r.db.Exec(ctx,
		"DELETE FROM fuzzer_runs WHERE id = $1",
		runID,
	)
	return err
}
