package main

import (
	"encoding/json"

	"github.com/metametamoon/untitled-crud/backend/internal/service"
)

func main() {
	result, err := service.ExtractTheAnalyzerExecution("./data/sample-run-extracted")
	if err != nil {
		panic(err)
	}
	data, err := json.Marshal(result)
	if err != nil {
		panic(err)
	}
	println(string(data))
}
