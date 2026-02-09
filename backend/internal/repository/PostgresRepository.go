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
		var logValue, configValue interface{}
		if run.Log.Valid {
			logValue = run.Log.String
		}
		if run.Config.Valid {
			configValue = run.Config.String
		}
		err := r.db.QueryRow(ctx,
			`INSERT INTO fuzzer_runs (timestamp, failure_count, log, config) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
			run.Timestamp, run.FailureCount, logValue, configValue,
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

	var comment, logStr, configStr pgtype.Text
	err := r.db.QueryRow(ctx, `
        SELECT id, timestamp, failure_count, comment, log, config
        FROM fuzzer_runs WHERE id = $1
    `, id).Scan(&run.ID, &run.Timestamp, &run.FailureCount, &comment, &logStr, &configStr)
	
	if err == nil && comment.Valid {
		commentStr := comment.String
		run.Comment = &commentStr
	}
	if err == nil {
		run.Log = logStr
		run.Config = configStr
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

		// Сохраняем теги бага, если они есть
		if len(opCrash.Tags) > 0 {
			if err := r.addCrashTags(ctx, opCrash.ID, opCrash.Tags); err != nil {
				return err
			}
		}

		for j := range opCrash.TestCases {
			testCase := &opCrash.TestCases[j]
			testCase.CrashID = opCrash.ID

			testJSON, _ := json.Marshal(testCase.Test)

			var reasonValue interface{}
			if testCase.Reason.Valid {
				reasonValue = testCase.Reason.String
			}

			err := r.db.QueryRow(ctx,
				`INSERT INTO test_cases (crash_id, hash, total_operations, test, reason) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
				testCase.CrashID, testCase.Hash, testCase.TotalOperations, testJSON, reasonValue,
			).Scan(&testCase.ID)
			if err != nil {
				return err
			}

			for k := range testCase.FSSummaries {
				fsSummary := &testCase.FSSummaries[k]
				fsSummary.TestCaseID = testCase.ID

				var stdoutValue interface{}
				var stderrValue interface{}
				if fsSummary.Stdout.Valid {
					stdoutValue = fsSummary.Stdout.String
				}
				if fsSummary.Stderr.Valid {
					stderrValue = fsSummary.Stderr.String
				}
				
				err := r.db.QueryRow(ctx,
					`INSERT INTO fs_test_summaries (test_case_id, fs_name, fs_success_count, fs_failure_count, fs_execution_time, fs_trace, stdout, stderr) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
					fsSummary.TestCaseID, fsSummary.FsName, fsSummary.FsSuccessCount,
					fsSummary.FsFailureCount, fsSummary.FsExecutionTime, fsSummary.FsTrace,
					stdoutValue, stderrValue,
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
		"SELECT id, operation, folder_id, comment FROM op_crashes WHERE run_id = $1",
		runID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var opCrashes []model.CrashesGroupedByFailedOperation
	for rows.Next() {
		var opCrash model.CrashesGroupedByFailedOperation
		var comment pgtype.Text
		if err := rows.Scan(&opCrash.ID, &opCrash.Operation, &opCrash.FolderID, &comment); err != nil {
			return nil, err
		}

		if comment.Valid {
			opCrash.Comment = &comment.String
		}

		tags, err := r.getCrashTags(ctx, opCrash.ID)
		if err != nil {
			return nil, err
		}
		opCrash.Tags = tags

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
		"SELECT id, hash, total_operations, test, reason FROM test_cases WHERE crash_id = $1",
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
		var reasonStr *string

		if err := rows.Scan(&testCase.ID, &testCase.Hash, &testCase.TotalOperations, &testJSON, &reasonStr); err != nil {
			return nil, err
		}

		json.Unmarshal(testJSON, &testCase.Test)

		if reasonStr != nil {
			testCase.Reason = pgtype.Text{
				String: *reasonStr,
				Valid:  true,
			}
		} else {
			testCase.Reason = pgtype.Text{Valid: false}
		}

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
		"SELECT id, fs_name, fs_success_count, fs_failure_count, fs_execution_time, fs_trace, stdout, stderr FROM fs_test_summaries WHERE test_case_id = $1",
		testCaseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fsSummaries []model.FsTestSummary
	for rows.Next() {
		var fsSummary model.FsTestSummary
		var stdoutStr, stderrStr *string
		if err := rows.Scan(&fsSummary.ID, &fsSummary.FsName, &fsSummary.FsSuccessCount,
			&fsSummary.FsFailureCount, &fsSummary.FsExecutionTime, &fsSummary.FsTrace,
			&stdoutStr, &stderrStr); err != nil {
			return nil, err
		}
		
		if stdoutStr != nil {
			fsSummary.Stdout = pgtype.Text{
				String: *stdoutStr,
				Valid:  true,
			}
		} else {
			fsSummary.Stdout = pgtype.Text{Valid: false}
		}
		
		if stderrStr != nil {
			fsSummary.Stderr = pgtype.Text{
				String: *stderrStr,
				Valid:  true,
			}
		} else {
			fsSummary.Stderr = pgtype.Text{Valid: false}
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

func (r *FuzzTraceRepository) getCrashTags(ctx context.Context, crashID int) ([]string, error) {
	rows, err := r.db.Query(ctx,
		"SELECT t.name FROM tags t JOIN crash_tags ct ON t.id = ct.tag_id WHERE ct.crash_id = $1",
		crashID,
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

func (r *FuzzTraceRepository) addCrashTags(ctx context.Context, crashID int, tagNames []string) error {
	currentTags, err := r.getCrashTags(ctx, crashID)
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
				"INSERT INTO crash_tags (crash_id, tag_id) VALUES ($1, $2) ON CONFLICT (crash_id, tag_id) DO NOTHING",
				crashID, tagID,
			)
			if err != nil {
				return err
			}
		}
	}

	// remove tags that are not in new list
	for _, tag := range currentTags {
		if !newTagSet[tag] {
			_, err = r.db.Exec(ctx,
				"DELETE FROM crash_tags WHERE crash_id = $1 AND tag_id = (SELECT id FROM tags WHERE name = $2)",
				crashID, tag,
			)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *FuzzTraceRepository) UpdateCrashTags(ctx context.Context, crashID int, tagNames []string) error {
	return r.addCrashTags(ctx, crashID, tagNames)
}

func (r *FuzzTraceRepository) UpdateCrashComment(ctx context.Context, crashID int, comment *string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE op_crashes SET comment = $1 WHERE id = $2",
		comment, crashID,
	)
	return err
}

func (r *FuzzTraceRepository) GetCrashRunID(ctx context.Context, crashID int) (int, error) {
	var runID int
	err := r.db.QueryRow(ctx,
		"SELECT run_id FROM op_crashes WHERE id = $1",
		crashID,
	).Scan(&runID)
	return runID, err
}
