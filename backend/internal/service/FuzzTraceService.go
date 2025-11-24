package service

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/jinzhu/copier"
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

func (s *FuzzTraceService) StoreFuzzerRun(ctx context.Context, runPath string) (int, error) {
	archive, err := zip.OpenReader("archive.zip")
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
				panic(err)
			}
			srcFile, err := f.Open()
			if err != nil {
				panic(err)
			}
			if _, err := io.Copy(dstFile, srcFile); err != nil {
				panic(err)
			}
			metadataContent, _ := os.ReadFile(f.Name)
			var data dto.Metadata
			err = json.Unmarshal(metadataContent, &data)
			metadata = &data
			if err != nil {
				panic(err)
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
	return runModel.ID, nil
}

func (s *FuzzTraceService) GetRuns(ctx context.Context) ([]model.FuzzerRun, error) {
	runs := []model.FuzzerRun{}

	runsResult, err := s.fuzzTraceRepo.GetRuns(ctx)
	if err != nil {
		return nil, err
	}
	copier.Copy(&runs, &runsResult)

	log.Printf("Successfully got fuzzer runs in the amout of %d", len(runs))
	return runs, nil
}

func (s *FuzzTraceService) GetRun(ctx context.Context, runID int) (*model.FuzzerRun, error) {
	run := model.FuzzerRun{}

	runDTO, err := s.fuzzTraceRepo.GetRun(ctx, runID)
	if err != nil {
		return nil, err
	}
	copier.Copy(&run, &runDTO)

	log.Printf("Successfully got fuzzer run with id %d", runID)
	return &run, nil
}

func (s *FuzzTraceService) GetAllTags(ctx context.Context) ([]model.Tag, error) {
	tags := []model.Tag{}

	tagsDTO, err := s.fuzzTraceRepo.GetAllTags(ctx)
	if err != nil {
		return nil, err
	}
	copier.Copy(tags, tagsDTO)

	log.Printf("Successfully got tags in the amout of %d", len(tags))
	return tags, nil
}
