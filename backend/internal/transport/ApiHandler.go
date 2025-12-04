package transport

import (
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

// PostFuzzerRun godoc
// @Summary Upload a fuzzing run archive
// @Description Uploads a ZIP archive representing a fuzzing run.
// @Tags runs
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "ZIP file with fuzzing run data"
// @Success 200 {object} dto.UploadResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /v1/runs [post]
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
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
	}

	c.JSON(http.StatusOK, dto.UploadResponse{Status: "success", Id: runId})
}

// GetFuzzerRunMetadata godoc
// @Summary Get metadata for a specific fuzzing run
// @Description Returns timestamp, failure count and tags for a fuzzing run.
// @Tags runs
// @Produce json
// @Param id path int true "Run ID"
// @Success 200 {object} dto.Metadata
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /v1/runs/metadatas/{id} [get]
func (h *FuzzTraceHandler) GetFuzzerRunMetadata(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid run ID"})
		return
	}

	run, err := h.service.GetRun(c.Request.Context(), runID)
	if run == nil && err == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Run not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	metadata := dto.Metadata{
		Timestamp:    run.Timestamp,
		FailureCount: run.FailureCount,
		Tags:         run.Tags,
	}

	c.JSON(http.StatusOK, metadata)
}

// GetFuzzerRunsMetadatas godoc
// @Summary Get metadata for all fuzzing runs
// @Description Returns a list of metadata entries with run IDs.
// @Tags runs
// @Produce json
// @Success 200 {array} dto.MetadataWithId
// @Failure 500 {object} dto.ErrorResponse
// @Router /v1/runs/metadatas [get]
func (h *FuzzTraceHandler) GetFuzzerRunsMetadatas(c *gin.Context) {
	runs, err := h.service.GetRuns(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
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

// DownloadArchive godoc
// @Summary Download a fuzzing run archive
// @Description Returns a ZIP archive containing the fuzzing run data.
// @Tags runs
// @Produce application/zip
// @Param id path int true "Run ID"
// @Success 200 {file} file "ZIP archive"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /v1/runs/archive/{id} [get]
func (h *FuzzTraceHandler) DownloadArchive(c *gin.Context) {
	runId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Invalid run ID"})
	}
	file, err := h.service.GetRunArchive(runId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Failed to open archive"})
	}
	c.Header("Content-Type", "application/zip")
	c.File(file)
}
