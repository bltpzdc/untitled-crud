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
	"strconv"

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

func (s *FuzzTraceService) StoreFuzzerRun(ctx context.Context, runArchivePath string) (int, error) {
	archive, err := zip.OpenReader(runArchivePath)
	if err != nil {
		panic(err)
	}

	var metadata *dto.Metadata = nil
	defer archive.Close()
	for _, f := range archive.File {
		if !f.FileInfo().IsDir() && f.Name == "metadata.json" {
			dstFileName := "./tmp.json"
			dstFile, err := os.OpenFile(dstFileName, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return 0, err
			}
			srcFile, err := f.Open()
			if err != nil {
				return 0, err
			}
			if _, err := io.Copy(dstFile, srcFile); err != nil {
				return 0, err
			}
			metadataContent, _ := os.ReadFile(dstFile.Name())
			metastr := string(metadataContent)
			print(metastr)
			var data dto.Metadata
			err = json.Unmarshal(metadataContent, &data)
			metadata = &data
			if err != nil {
				return 0, err
			}
		}
	}
	if metadata == nil {
		panic("no metadata found")
	}

	runModel := model.FuzzerRun{
		ID:                              0,
		Timestamp:                       metadata.Timestamp,
		FailureCount:                    metadata.FailureCount,
		Tags:                            metadata.Tags,
		CrashesGroupedByFailedOperation: make([]model.CrashesGroupedByFailedOperation, 0),
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
		}
	}
	log.Printf("Successfully got fuzzer runs in the amout of %d", len(runs))
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

func (s *FuzzTraceService) GetRunArchive(id int) (string, error) {
	archivePath := s.calculateArchivePath(id)
	_, err := os.Stat(archivePath)
	return archivePath, err
}
