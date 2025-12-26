package transport

import (
	"log/slog"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/metametamoon/untitled-crud/backend/internal/service"
	"github.com/metametamoon/untitled-crud/backend/internal/transport/dto"
)

type FuzzTraceHandler struct {
	service *service.FuzzTraceService
}

func NewFuzzTraceHandler(service *service.FuzzTraceService) *FuzzTraceHandler {
	return &FuzzTraceHandler{service: service}
}

func (h *FuzzTraceHandler) PostFuzzerRun(c *gin.Context) {
	file, _ := c.FormFile("file")
	randNumber := rand.Int()
	filePath := "./tmp/" + strconv.Itoa(randNumber) + ".zip"
	err := c.SaveUploadedFile(file, filePath)
	if err != nil {
		return
	}
	runId, err := h.service.StoreFuzzerRun(c.Request.Context(), filePath)
	if err != nil {
		slog.Error("Failed to store fuzzer rn", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error()})
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "id": runId})
}

func (h *FuzzTraceHandler) GetFuzzerRunMetadata(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
		return
	}

	run, err := h.service.GetRun(c.Request.Context(), runID)
	if run == nil && err == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Run not found"})
		return
	}
	if err != nil {
		slog.Error("Failed to get metadata", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	metadata := dto.Metadata{
		Timestamp:    run.Timestamp,
		FailureCount: run.FailureCount,
		Tags:         run.Tags,
	}

	c.JSON(http.StatusOK, metadata)
}

func (h *FuzzTraceHandler) GetFuzzerRunsMetadatas(c *gin.Context) {
	runs, err := h.service.GetRuns(c.Request.Context())
	if err != nil {
		slog.Error("Failed to get metadatas", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := make([]dto.MetadataWithId, 0)
	for id, run := range runs {
		result = append(result, dto.MetadataWithId{
			Id: id,
			Metadata: dto.Metadata{
				Timestamp:    run.Timestamp,
				FailureCount: run.FailureCount,
				Tags:         run.Tags,
			},
		})
	}

	c.JSON(http.StatusOK, result)
}

func (h *FuzzTraceHandler) DownloadArchive(c *gin.Context) {
	runId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
	}
	file, err := h.service.GetRunArchive(runId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Failed to open archive"})
	}
	c.Header("Content-Type", "application/zip")
	c.File(file)
}
