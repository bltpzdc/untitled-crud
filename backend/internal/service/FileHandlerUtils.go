package service

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

func ExtractTheAnalyzerExecution(base string) (model.AnalyzerExecution, error) {
	entries, err := os.ReadDir(base)
	if err != nil {
		return model.AnalyzerExecution{}, err
	}
	var metadata *model.Metadata = nil
	var logfile = ""
	tests := make([]model.Test, 0)
	for _, topLevel := range entries {
		if topLevel.IsDir() {
			groupFolders, err := os.ReadDir(filepath.Join(base, topLevel.Name()))
			if err != nil {
				return model.AnalyzerExecution{}, err
			}
			for _, groupFolder := range groupFolders {
				if !groupFolder.IsDir() {
					continue
				}
				testFolders, err := os.ReadDir(filepath.Join(base, topLevel.Name(), groupFolder.Name()))
				if err != nil {
					return model.AnalyzerExecution{}, err
				}
				for _, testFolder := range testFolders {
					testFiles, err := os.ReadDir(filepath.Join(base, topLevel.Name(), groupFolder.Name(), testFolder.Name()))
					if err != nil {
						return model.AnalyzerExecution{}, err
					}
					for _, file := range testFiles {
						if file.IsDir() {
							continue
						}
						if file.Name() == "test.json" {
							trace, err := ParseFsLog(filepath.Join(base, topLevel.Name(), groupFolder.Name(), testFolder.Name(), file.Name()))
							if err != nil {
								return model.AnalyzerExecution{}, err
							}
							tests = append(tests, model.Test{
								TestContent: trace,
								Executions:  make([]model.FileSystemExecution, 0),
							})
						}
					}
				}
			}
		} else {
			switch topLevel.Name() {
			case "metadata.json":
				metadata = &model.Metadata{DateSent: "unparsed metadata.json"}
			case "configuration.toml":
				logfile = "configuration.toml"
			}
		}
	}
	if metadata == nil {
		return model.AnalyzerExecution{}, fmt.Errorf("failed to extract metadata.json")
	}
	return model.AnalyzerExecution{
		Id:             0,
		Metadata:       *metadata,
		LogFile:        logfile,
		FoundTests:     tests,
		ZipArchivePath: base,
	}, nil
}
