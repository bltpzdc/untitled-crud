package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"math/rand"
	"net/http/httptest"
	"testing"
	"strings"
	"slices"

	"github.com/gin-gonic/gin"
	"github.com/metametamoon/untitled-crud/backend/internal/db"
	"github.com/metametamoon/untitled-crud/backend/internal/repository"
	"github.com/metametamoon/untitled-crud/backend/internal/service"
	"github.com/metametamoon/untitled-crud/backend/internal/transport"
	"github.com/stretchr/testify/require"
)

func newTestServer(t *testing.T) *httptest.Server {
	gin.SetMode(gin.TestMode)

	// TODO test db
	database, err := db.NewDB()
	require.NoError(t, err)
	t.Cleanup(func() {
		database.Close()
	})

	repo := repository.NewFuzzTraceRepository(database.Pool)
	svc := service.NewFuzzTraceService(repo)
	h := transport.NewFuzzTraceHandler(svc)

	r := gin.New()
	r.POST("/v1/runs", h.PostFuzzerRun)
	r.GET("/v1/runs/metadatas", h.GetFuzzerRunsMetadatas)
	r.GET("/v1/runs/metadata/:id", h.GetFuzzerRunMetadata)
	r.GET("/v1/runs/archive/:id", h.DownloadArchive)
	r.GET("/v1/runs/details/:id", h.GetFuzzerRunDetails)

	return httptest.NewServer(r)
}

func makeTestZip(t *testing.T, failureCount int) *bytes.Buffer {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)
	t.Cleanup(func() { zw.Close() })

	meta := map[string]any{
		"timestamp":    "2025-11-25T22:00:00Z",
		"failureCount": failureCount,
		"tags":         []string{"critical", "not-a-problem"},
	}
	data, err := json.Marshal(meta)
	require.NoError(t, err)

	f, err := zw.Create("metadata.json")
	require.NoError(t, err)
	_, err = f.Write(data)
	require.NoError(t, err)

	extendZipWithCrashes(t, zw, failureCount)

	require.NoError(t, zw.Close())
	return buf
}

type ResponseData struct {
    SuccessN int         `json:"success_n"`
    FailureN int         `json:"failure_n"`
    Rows     interface{} `json:"rows"`
}

var availableOperations = []string{
    "LSeek", "PRead", "Shrink", "Rename", "Truncate",
	"Open", "Read", "Write", "Mkdir", "Rmdir",
}
var countOperations = 100

func extendZipWithCrashes(t *testing.T, zw *zip.Writer, failureCount int) {
	var crashDirNames []string
	for i := 0; i < len(availableOperations) && i < failureCount; i++ {
		crashDirName := "trace-" + availableOperations[i % len(availableOperations)]
		crashDirPath := crashDirName + "/"
		crashDirNames = append(crashDirNames, crashDirName)

		_, err := zw.Create(crashDirPath)
		require.NoError(t, err)
	}

	var uniqueDirNames []string
	for i := 0; i < failureCount; i++ {
		uniqueDirName := randomSeq(20)
		uniqueDirPath := crashDirNames[i % len(availableOperations)] + "/" + uniqueDirName + "/"
		uniqueDirNames = append(uniqueDirNames, uniqueDirPath)

		_, err := zw.Create(uniqueDirPath)
		require.NoError(t, err)
	}

	for i := 0; i < failureCount; i++ {
		operations, results := generateRandomOperationsAndResults()

		for _, fs := range []string{"ext4", "xfs"} {
			data := makeFsTrace(fs, operations, results)
			jsonTrace, err := json.MarshalIndent(data, "", "  ")
			require.NoError(t, err)

			jsonPath := uniqueDirNames[i] + fs + ".trace.json"
			jsonWriter, err := zw.Create(jsonPath)
			require.NoError(t, err)
			
			_, err = jsonWriter.Write(jsonTrace)
			require.NoError(t, err)

			// Emulate error in fuzzer
			index := slices.Index(operations, availableOperations[i % len(availableOperations)])
			results[index] = !results[index]
		}

	}
}

func makeFsTrace(fsName string, operations []string, results []bool) ResponseData {
	successN := 0
    failureN := 0
    
    rows := make([]interface{}, len(operations))
    
    for i, operation := range operations {
        isSuccess := results[i]

		if isSuccess {
            successN++
        } else {
            failureN++
        }
        
        returnCode := 0
        if !isSuccess {
            returnCode = -1
        } else {
            returnCode = rand.Intn(5)
        }
        
        opData := map[string]interface{}{
            "operation":   strings.ToUpper(operation),
            "return_code": returnCode,
        }

		if isSuccess {
			opData["execution_time"] = rand.Intn(90) + 10

            rows[i] = map[string]interface{}{
                "Success": opData,
            }
        } else {
            rows[i] = map[string]interface{}{
                "Failure": opData,
            }
        }
    }
    
    return ResponseData{
        SuccessN: successN,
        FailureN: failureN,
        Rows:     rows,
    }
}

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
func randomSeq(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }

    return string(b)
}

func generateRandomOperationsAndResults() ([]string, []bool) {
	operations := make([]string, countOperations)
	results := make([]bool, countOperations)

    for i := 0; i < countOperations; i++ {
        operations[i] = availableOperations[rand.Intn(len(availableOperations))]
		results[i] = rand.Float32() < 0.5
    }
    
    return operations, results
}
