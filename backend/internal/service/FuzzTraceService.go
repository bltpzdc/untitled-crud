package service

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/metametamoon/untitled-crud/backend/internal/model"
	"github.com/metametamoon/untitled-crud/backend/internal/transport/dto"

	"github.com/metametamoon/untitled-crud/backend/internal/repository"
)

type FuzzTraceService struct {
	fuzzTraceRepo *repository.FuzzTraceRepository
}

func NewFuzzTraceService(fuzzTraceRepo *repository.FuzzTraceRepository) *FuzzTraceService {
	return &FuzzTraceService{
		fuzzTraceRepo: fuzzTraceRepo,
	}
}

func copyZip(srcPath, dstPath string) error {
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("failed to open source file %s: %w", srcPath, err)
	}
	defer srcFile.Close()

	dstDir := filepath.Dir(dstPath)

	err = os.MkdirAll(dstDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create parent directories for %s: %w", dstPath, err)
	}

	dstFile, err := os.Create(dstPath)
	if err != nil {
		return fmt.Errorf("failed to create destination file %s: %w", dstPath, err)
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	if err != nil {
		return fmt.Errorf("failed to copy file content from %s to %s: %w", srcPath, dstPath, err)
	}

	err = dstFile.Sync()
	if err != nil {
		return fmt.Errorf("failed to sync destination file %s: %w", dstPath, err)
	}

	return nil
}

func (s *FuzzTraceService) calculateArchivePath(id int) string {
	return path.Join(".", "archives", strconv.Itoa(id), "archive.zip")
}

// I fucking hate go. Come on, is this really the least verbose way to unzip a fucking zip archive?
func UnzipArchiveToTemp(archive *zip.ReadCloser) (string, error) {
	defer archive.Close()

	tempDir, err := os.MkdirTemp("", "unzipped-content-")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary directory: %w", err)
	}

	for _, f := range archive.File {
		destPath := filepath.Join(tempDir, f.Name)

		if !strings.HasPrefix(destPath, filepath.Clean(tempDir)+string(os.PathSeparator)) {
			os.RemoveAll(tempDir)
			return "", fmt.Errorf("illegal file path found: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(destPath, 0700); err != nil {
				os.RemoveAll(tempDir)
				return "", fmt.Errorf("failed to create directory %s: %w", destPath, err)
			}
			continue
		}

		rc, err := f.Open()
		if err != nil {
			os.RemoveAll(tempDir)
			return "", fmt.Errorf("failed to open file inside archive: %w", err)
		}

		if err := os.MkdirAll(filepath.Dir(destPath), os.ModePerm); err != nil {
			os.RemoveAll(tempDir)
			rc.Close()
			return "", fmt.Errorf("failed to create parent directories for %s: %w", destPath, err)
		}

		dstFile, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			os.RemoveAll(tempDir)
			rc.Close()
			return "", fmt.Errorf("failed to create destination file %s: %w", destPath, err)
		}

		if _, err := io.Copy(dstFile, rc); err != nil {
			os.RemoveAll(tempDir)
			dstFile.Close()
			rc.Close()
			return "", fmt.Errorf("failed to copy file content to %s: %w", destPath, err)
		}

		dstFile.Close()
		rc.Close()
	}

	return tempDir, nil
}

func (s *FuzzTraceService) StoreFuzzerRun(ctx context.Context, runArchivePath string) (int, error) {
	archive, err := zip.OpenReader(runArchivePath)
	if err != nil {
		panic(err)
	}

	var metadata = &dto.Metadata{}
	defer archive.Close()
	tmpDir, err := UnzipArchiveToTemp(archive)
	if err != nil {
		return 0, err
	}
	items, _ := os.ReadDir(tmpDir)
	crashesGroupedByFailedOperations := make([]model.CrashesGroupedByFailedOperation, 0)
	for _, topLevel := range items {
		if !topLevel.IsDir() && topLevel.Name() == "metadata.json" {
			_, err2 := s.extractMetadata(topLevel, tmpDir, metadata)
			if err2 != nil {
				return 0, err2
			}
		}
		if topLevel.IsDir() && topLevel.Name() == "crashes" {
			grouped, _ := os.ReadDir(filepath.Join(tmpDir, topLevel.Name()))
			for _, f := range grouped {
				if f.IsDir() && strings.HasPrefix(f.Name(), "trace-") {
					operationDirSplited := strings.Split(f.Name(), "-")
					operation := operationDirSplited[1]
					crashesGroupedBySpecificOperation := model.CrashesGroupedByFailedOperation{
						ID:        0,
						RunID:     0, // yet unknown
						Operation: operation,
						TestCases: nil,
					}

					testCases := make([]model.TestCase, 0)

					groups, _ := os.ReadDir(filepath.Join(tmpDir, topLevel.Name(), f.Name()))
					for _, group := range groups {
						if group.IsDir() {
							testArtifactsDir := filepath.Join(tmpDir, topLevel.Name(), f.Name(), group.Name())

							testCase, err := s.extractTestCase(testArtifactsDir, group.Name())
							if err != nil {
								return 0, err
							}
							testCases = append(testCases, testCase)
						}
					}

					crashesGroupedBySpecificOperation.TestCases = testCases
					crashesGroupedByFailedOperations = append(crashesGroupedByFailedOperations, crashesGroupedBySpecificOperation)
				}
			}
		}
	}

	runModel := model.FuzzerRun{
		ID:                              0,
		Timestamp:                       metadata.Timestamp,
		FailureCount:                    metadata.FailureCount,
		Tags:                            metadata.Tags,
		CrashesGroupedByFailedOperation: crashesGroupedByFailedOperations,
	}

	if err := s.fuzzTraceRepo.StoreRun(ctx, &runModel); err != nil {
		return 0, fmt.Errorf("failed to store run: %w", err)
	}
	id := runModel.ID
	err = copyZip(runArchivePath, s.calculateArchivePath(id))
	if err != nil {
		return 0, fmt.Errorf("failed to store archive: %w", err)
	}
	return id, nil
}

func (s *FuzzTraceService) extractTestCase(testDir string, hash string) (model.TestCase, error) {
	testCase := model.TestCase{
		ID:              0,
		CrashID:         0,
		Hash:            hash,
		TotalOperations: 0,
		Test:            pgtype.Text{},
		FSSummaries:     nil,
	}
	fsSummaries := make([]model.FsTestSummary, 0)
	testFiles, _ := os.ReadDir(testDir)
	for _, testFile := range testFiles {
		re := regexp.MustCompile("(.+).trace.json")
		matches := re.FindStringSubmatch(testFile.Name())
		if len(matches) > 1 {
			fsName := matches[1]
			testFileFullPath := filepath.Join(testDir, testFile.Name())
			contentBytes, err := os.ReadFile(testFileFullPath)
			if err != nil {
				return model.TestCase{}, fmt.Errorf("failed to read fs trace file: %w", err)
			}
			fsSummary := model.FsTestSummary{
				0,
				0,
				fsName,
				0,
				0,
				pgtype.Interval{Valid: true},
				pgtype.Text{
					string(contentBytes), true,
				},
			}
			fsSummaries = append(fsSummaries, fsSummary)
			continue
		}
		if testFile.Name() == "test.json" {
			contentBytes, err := os.ReadFile(filepath.Join(testDir, testFile.Name()))
			if err != nil {
				return model.TestCase{}, fmt.Errorf("failed to read test.json file: %w", err)
			}

			testCase.Test = pgtype.Text{
				String: string(contentBytes),
				Valid:  true,
			}
		}
	}
	testCase.FSSummaries = fsSummaries
	return testCase, nil
}

func (s *FuzzTraceService) extractMetadata(f os.DirEntry, tmpDir string, metadata *dto.Metadata) (int, error) {
	dstFileName, err := os.CreateTemp("", "tmp.json")
	if err != nil {
		return 0, fmt.Errorf("failed to create temp file: %w", err)
	}
	dstFile, err := os.OpenFile(dstFileName.Name(), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Type())
	if err != nil {
		return 0, err
	}
	srcFile, err := os.Open(filepath.Join(tmpDir, f.Name()))
	if err != nil {
		return 0, err
	}
	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return 0, err
	}
	metadataContent, _ := os.ReadFile(dstFile.Name())
	err = json.Unmarshal(metadataContent, metadata)
	if err != nil {
		return 0, err
	}
	return 0, nil
}

func (s *FuzzTraceService) GetRuns(ctx context.Context) (map[int]model.Metadata, error) {
	runs, err := s.fuzzTraceRepo.GetRuns(ctx)
	if err != nil {
		return nil, err
	}
	result := make(map[int]model.Metadata)
	for _, run := range runs {
		result[run.ID] = model.Metadata{
			Timestamp:    run.Timestamp,
			FailureCount: run.FailureCount,
			Tags:         run.Tags,
			Comment:      run.Comment,
		}
	}
	log.Printf("Successfully got fuzzer runs in the amount of %d", len(runs))
	return result, nil
}

func (s *FuzzTraceService) GetRun(ctx context.Context, runID int) (*model.FuzzerRun, error) {
	run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
	if err != nil {
		return nil, err
	}
	log.Printf("Successfully got fuzzer run with id %d", runID)
	return run, nil
}

func (s *FuzzTraceService) GetRunsBySearchPattern(ctx context.Context, pattern model.RunSearchPattern) ([]model.FuzzerRun, error) {
	runs, err := s.fuzzTraceRepo.GetRuns(ctx)
	if err != nil {
		return nil, err
	}
	
	var fromDateStart, toDateStart *time.Time
	if pattern.FromDate != nil {
		fromDateUTC := pattern.FromDate.UTC()
		start := time.Date(fromDateUTC.Year(), fromDateUTC.Month(), fromDateUTC.Day(), 0, 0, 0, 0, time.UTC)
		fromDateStart = &start
	}
	if pattern.ToDate != nil {
		toDateUTC := pattern.ToDate.UTC()
		start := time.Date(toDateUTC.Year(), toDateUTC.Month(), toDateUTC.Day(), 0, 0, 0, 0, time.UTC)
		toDateStart = &start
	}
	
	result := make([]model.FuzzerRun, 0)
	for _, run := range runs {
		t, err := time.Parse(time.RFC3339, run.Timestamp)
		if err != nil {
			continue
		}
		
		tUTC := t.UTC()
		runDate := time.Date(tUTC.Year(), tUTC.Month(), tUTC.Day(), 0, 0, 0, 0, time.UTC)
		
		dateMatch := true
		

		if fromDateStart != nil {
			if runDate.Before(*fromDateStart) {
				dateMatch = false
			}
		}
		
		if toDateStart != nil {
			if runDate.After(*toDateStart) {
				dateMatch = false
			}
		}
		
		if dateMatch {
			result = append(result, run)
		}
	}

	return result, nil
}

func (s *FuzzTraceService) GetRunArchive(id int) (string, error) {
	archivePath := s.calculateArchivePath(id)
	_, err := os.Stat(archivePath)
	return archivePath, err
}

func (s *FuzzTraceService) GetAllTags(ctx context.Context) ([]model.Tag, error) {
	tags, err := s.fuzzTraceRepo.GetAllTags(ctx)
	if err != nil {
		return nil, err
	}
	return tags, nil
}

func (s *FuzzTraceService) UpdateRunTags(ctx context.Context, runID int, tags []string) error {
	run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
	if err != nil {
		return err
	}
	if run == nil {
		return fmt.Errorf("run with id %d not found", runID)
	}
	return s.fuzzTraceRepo.UpdateRunTags(ctx, runID, tags)
}

func (s *FuzzTraceService) UpdateRunComment(ctx context.Context, runID int, comment *string) error {
	run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
	if err != nil {
		return err
	}
	if run == nil {
		return fmt.Errorf("run with id %d not found", runID)
	}
	return s.fuzzTraceRepo.UpdateRunComment(ctx, runID, comment)
}

func (s *FuzzTraceService) DeleteRun(ctx context.Context, runID int) error {
	run, err := s.fuzzTraceRepo.GetRun(ctx, runID)
	if err != nil {
		return err
	}
	if run == nil {
		return fmt.Errorf("run with id %d not found", runID)
	}
	return s.fuzzTraceRepo.DeleteRun(ctx, runID)
}

func (s *FuzzTraceService) GetRunsBySearchPatternWithTags(ctx context.Context, pattern model.RunSearchPattern, tags []string) ([]model.FuzzerRun, error) {
	runs, err := s.fuzzTraceRepo.GetRuns(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]model.FuzzerRun, 0)
	for _, run := range runs {
		dateMatch := true
		if pattern.FromDate != nil || pattern.ToDate != nil {
			t, err := time.Parse(time.RFC3339, run.Timestamp)
			if err != nil {
				dateMatch = false
			} else {
				tUTC := t.UTC()
				runDate := time.Date(tUTC.Year(), tUTC.Month(), tUTC.Day(), 0, 0, 0, 0, time.UTC)
				
				if pattern.FromDate != nil {
					fromDateUTC := pattern.FromDate.UTC()
					fromDateStart := time.Date(fromDateUTC.Year(), fromDateUTC.Month(), fromDateUTC.Day(), 0, 0, 0, 0, time.UTC)
					if runDate.Before(fromDateStart) {
						dateMatch = false
					}
				}

				if pattern.ToDate != nil {
					toDateUTC := pattern.ToDate.UTC()
					toDateStart := time.Date(toDateUTC.Year(), toDateUTC.Month(), toDateUTC.Day(), 0, 0, 0, 0, time.UTC)
			
					if runDate.After(toDateStart) {
						dateMatch = false
					}
				}
			}
		}

		tagMatch := true
		if len(tags) > 0 {
			tagMatch = false
			runTagSet := make(map[string]bool)
			for _, tag := range run.Tags {
				runTagSet[tag] = true
			}
			for _, filterTag := range tags {
				if runTagSet[filterTag] {
					tagMatch = true
					break
				}
			}
		}

		if dateMatch && tagMatch {
			result = append(result, run)
		}
	}

	return result, nil
}
