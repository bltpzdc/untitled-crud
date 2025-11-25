package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

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

	conn, err := database.Pool.Acquire(context.Background())
	require.NoError(t, err)
	t.Cleanup(func() {
		conn.Release()
	})

	repo := repository.NewFuzzTraceRepository(conn.Conn())
	svc := service.NewFuzzTraceService(repo)
	h := transport.NewFuzzTraceHandler(svc)

	r := gin.New()
	r.POST("/v1/runs", h.PostFuzzerRun)
	r.GET("/v1/runs/metadatas", h.GetFuzzerRunsMetadatas)
	r.GET("/v1/runs/metadata/:id", h.GetFuzzerRunMetadata)
	r.GET("/v1/runs/archive/:id", h.DownloadArchive)

	return httptest.NewServer(r)
}

func makeTestZip(t *testing.T, failureCount int) *bytes.Buffer {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)
	t.Cleanup(func() { zw.Close() })

	meta := map[string]any{
		"timestamp":    "2025-11-25T22:00:00Z",
		"failureCount": 5,
		"tags":         []string{"critical", "not-a-problem"},
	}
	data, err := json.Marshal(meta)
	require.NoError(t, err)

	f, err := zw.Create("metadata.json")
	require.NoError(t, err)
	_, err = f.Write(data)
	require.NoError(t, err)

	require.NoError(t, zw.Close())
	return buf
}
