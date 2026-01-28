package transport

import (
	"log/slog"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
	"github.com/metametamoon/untitled-crud/backend/internal/model"
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
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": err.Error()})
	}
	randNumber := rand.Int()
	filePath := "./tmp/" + strconv.Itoa(randNumber) + ".zip"
	err = c.SaveUploadedFile(file, filePath)
	if err != nil {
		return
	}
	runId, err := h.service.StoreFuzzerRun(c.Request.Context(), filePath)
	if err != nil {
		slog.Error("Failed to store fuzzer run", "error", err)
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
		Comment:      run.Comment,
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
				Comment:      run.Comment,
			},
		})
	}

	c.JSON(http.StatusOK, result)
}

func (h *FuzzTraceHandler) GetFuzzerRunDetails(c *gin.Context) {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var details dto.RunDetailsWithId
	details.Id = runID
	copier.Copy(&details.Crashes, &run.CrashesGroupedByFailedOperation)

	c.JSON(http.StatusOK, details)
}

// why must this be a separate function?...
func parseOptionalDate(val string) (*time.Time, error) {
	if val == "-" || val == "" {
		return nil, nil
	}
	t, err := time.ParseInLocation("2006-01-02", val, time.UTC)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (h *FuzzTraceHandler) GetFuzzerRunsBySearchPattern(c *gin.Context) {
	fromDate, err := parseOptionalDate(c.Query("fromdate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fromdate"})
		return
	}
	toDate, err := parseOptionalDate(c.Query("todate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todate"})
		return
	}

	runs, err := h.service.GetRunsBySearchPattern(c.Request.Context(), model.RunSearchPattern{
		FromDate: fromDate,
		ToDate:   toDate,
	})

	result := make([]dto.MetadataWithId, 0)
	for id, run := range runs {
		result = append(result, dto.MetadataWithId{
			Id: id,
			Metadata: dto.Metadata{
				Timestamp:    run.Timestamp,
				FailureCount: run.FailureCount,
				Tags:         run.Tags,
				Comment:      run.Comment,
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

func (h *FuzzTraceHandler) GetAllTags(c *gin.Context) {
	tags, err := h.service.GetAllTags(c.Request.Context())
	if err != nil {
		slog.Error("Failed to get tags", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := make([]dto.Tag, 0)
	for _, tag := range tags {
		result = append(result, dto.Tag{
			ID:   tag.ID,
			Name: tag.Name,
		})
	}
	c.JSON(http.StatusOK, result)
}

func (h *FuzzTraceHandler) UpdateRunTags(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
		return
	}

	var request struct {
		Tags []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.service.UpdateRunTags(c.Request.Context(), runID, request.Tags)
	if err != nil {
		slog.Error("Failed to update run tags", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *FuzzTraceHandler) UpdateRunComment(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
		return
	}

	var request struct {
		Comment *string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.service.UpdateRunComment(c.Request.Context(), runID, request.Comment)
	if err != nil {
		slog.Error("Failed to update run comment", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *FuzzTraceHandler) DeleteRun(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
		return
	}

	err = h.service.DeleteRun(c.Request.Context(), runID)
	if err != nil {
		slog.Error("Failed to delete run", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *FuzzTraceHandler) GetFuzzerRunsBySearchPatternWithTags(c *gin.Context) {
	fromDate, err := parseOptionalDate(c.Query("fromdate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fromdate"})
		return
	}
	toDate, err := parseOptionalDate(c.Query("todate"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todate"})
		return
	}

	var tags []string
	if tagsParam := c.Query("tags"); tagsParam != "" {
		tags = strings.Split(tagsParam, ",")
		for i := range tags {
			tags[i] = strings.TrimSpace(tags[i])
		}
	}

	runs, err := h.service.GetRunsBySearchPatternWithTags(c.Request.Context(), model.RunSearchPattern{
		FromDate: fromDate,
		ToDate:   toDate,
	}, tags)

	result := make([]dto.MetadataWithId, 0)
	for _, run := range runs {
		result = append(result, dto.MetadataWithId{
			Id: run.ID,
			Metadata: dto.Metadata{
				Timestamp:    run.Timestamp,
				FailureCount: run.FailureCount,
				Tags:         run.Tags,
			},
		})
	}

	c.JSON(http.StatusOK, result)
}
