package service

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/metametamoon/untitled-crud/backend/internal/model"
)

type logFile struct {
	Ops []map[string]json.RawMessage `json:"ops"`
}

func ParseFsLog(filePath string) ([]model.FsOperation, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %s: %w", filePath, err)
	}

	var logFile logFile
	if err := json.Unmarshal(data, &logFile); err != nil {
		return nil, fmt.Errorf("failed to unmarshal log file structure: %w", err)
	}

	var operations []model.FsOperation

	for i, opMap := range logFile.Ops {
		if len(opMap) != 1 {
			return nil, fmt.Errorf("malformed operation at index %d: expected single key", i)
		}

		for opType, rawParams := range opMap {

			op := model.FsOperation{
				Type: opType,
			}

			var params map[string]any
			if err := json.Unmarshal(rawParams, &params); err != nil {
				return nil, fmt.Errorf("failed to parse %s parameters at index %d: %w", opType, i, err)
			}

			op.Params = params
			operations = append(operations, op)
		}
	}

	return operations, nil
}
