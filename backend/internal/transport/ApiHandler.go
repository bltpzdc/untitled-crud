package transport

import (
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
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

// PostFuzzerRun godoc
// @Summary      Upload a fuzzer run archive
// @Description  Upload a ZIP archive containing fuzzer run data
// @Tags         runs
// @Accept       multipart/form-data
// @Produce      json
// @Param        file formData file true "ZIP archive file"
// @Success      200  {object}  map[string]interface{} "status: success, id: run ID"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /v1/runs [post]
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

// GetFuzzerRunMetadata godoc
// @Summary      Get fuzzer run metadata
// @Description  Get metadata for a specific fuzzer run by ID
// @Tags         runs
// @Produce      json
// @Param        id   path      int  true  "Run ID"
// @Success      200  {object}  dto.Metadata
// @Failure      400  {object}  map[string]string "error message"
// @Failure      404  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/metadata/{id} [get]
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

// GetFuzzerRunsMetadatas godoc
// @Summary      Get all fuzzer runs metadata
// @Description  Get metadata for all fuzzer runs
// @Tags         runs
// @Produce      json
// @Success      200  {array}   dto.MetadataWithId
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/metadatas [get]
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

// GetFuzzerRunDetails godoc
// @Summary      Get fuzzer run details
// @Description  Get detailed information about a fuzzer run including crashes
// @Tags         runs
// @Produce      json
// @Param        id   path      int  true  "Run ID"
// @Success      200  {object}  dto.RunDetailsWithId
// @Failure      400  {object}  map[string]string "error message"
// @Failure      404  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/details/{id} [get]
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
	details.Log = run.Log
	details.Config = run.Config
	
	// Копируем crashes с явной обработкой вложенных структур
	details.Crashes = make([]dto.CrashesGroupedByFailedOperation, len(run.CrashesGroupedByFailedOperation))
	for i, crash := range run.CrashesGroupedByFailedOperation {
		details.Crashes[i] = dto.CrashesGroupedByFailedOperation{
			ID:        crash.ID,
			RunID:     crash.RunID,
			Operation: crash.Operation,
			FolderID:  crash.FolderID,
			Comment:   crash.Comment,
			Tags:      crash.Tags,
			TestCases: make([]dto.TestCase, len(crash.TestCases)),
		}
		
		// Копируем TestCases с явной обработкой полей Test и Reason
		for j, testCase := range crash.TestCases {
			details.Crashes[i].TestCases[j] = dto.TestCase{
				ID:              testCase.ID,
				CrashID:         testCase.CrashID,
				Hash:            testCase.Hash,
				TotalOperations: testCase.TotalOperations,
				Test:            testCase.Test,
				Reason:          testCase.Reason,
				FSSummaries:     make([]dto.FsTestSummary, len(testCase.FSSummaries)),
			}
			
			// Копируем FSSummaries
			for k, fsSummary := range testCase.FSSummaries {
				details.Crashes[i].TestCases[j].FSSummaries[k] = dto.FsTestSummary{
					ID:              fsSummary.ID,
					TestCaseID:      fsSummary.TestCaseID,
					FsName:          fsSummary.FsName,
					FsSuccessCount:  fsSummary.FsSuccessCount,
					FsFailureCount:  fsSummary.FsFailureCount,
					FsExecutionTime: fsSummary.FsExecutionTime,
					FsTrace:         fsSummary.FsTrace,
					Stdout:          fsSummary.Stdout,
					Stderr:          fsSummary.Stderr,
				}
			}
		}
	}

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

// GetFuzzerRunsBySearchPattern godoc
// @Summary      Search fuzzer runs by date range
// @Description  Get fuzzer runs filtered by date range
// @Tags         runs
// @Produce      json
// @Param        fromdate  query     string  false  "Start date (YYYY-MM-DD)"
// @Param        todate    query     string  false  "End date (YYYY-MM-DD)"
// @Success      200       {array}   dto.MetadataWithId
// @Failure      400       {object}  map[string]string "error message"
// @Failure      500       {object}  map[string]string "error message"
// @Router       /runs/search [get]
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

// DownloadArchive godoc
// @Summary      Download run archive
// @Description  Download ZIP archive for a specific fuzzer run
// @Tags         runs
// @Produce      application/zip
// @Param        id   path      int  true  "Run ID"
// @Success      200  {file}    binary "ZIP file"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      404  {object}  map[string]string "error message"
// @Router       /runs/archive/{id} [get]
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

// DownloadBugArchive godoc
// @Summary      Download bug archive
// @Description  Download ZIP archive for a specific crash/bug test case
// @Tags         bugs
// @Produce      application/zip
// @Param        id   path      int     true  "Crash ID"
// @Param        hash query     string  false "Test case hash (optional)"
// @Success      200  {file}    binary "ZIP file"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      404  {object}  map[string]string "error message"
// @Router       /bugs/{id}/archive [get]
func (h *FuzzTraceHandler) DownloadBugArchive(c *gin.Context) {
	crashID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid crash ID"})
		return
	}
	testCaseHash := c.Query("hash")
	file, err := h.service.GetBugArchive(c.Request.Context(), crashID, testCaseHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	
	defer func() {
		if err := os.Remove(file); err != nil {
			slog.Error("Failed to remove temp file", "file", file, "error", err)
		}
	}()
	
	filename := fmt.Sprintf("bug-%d.zip", crashID)
	if testCaseHash != "" {
		filename = fmt.Sprintf("bug-%d-%s.zip", crashID, testCaseHash)
	}
	
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.File(file)
}

// GetAllTags godoc
// @Summary      Get all tags
// @Description  Get list of all available tags
// @Tags         tags
// @Produce      json
// @Success      200  {array}   dto.Tag
// @Failure      500  {object}  map[string]string "error message"
// @Router       /tags [get]
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

// UpdateRunTags godoc
// @Summary      Update run tags
// @Description  Update tags for a specific fuzzer run
// @Tags         runs
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Run ID"
// @Param        request body object true "Tags array" SchemaExample({"tags": ["tag1", "tag2"]})
// @Success      200  {object}  map[string]string "status: success"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/{id}/tags [put]
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

// UpdateRunComment godoc
// @Summary      Update run comment
// @Description  Update comment for a specific fuzzer run
// @Tags         runs
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Run ID"
// @Param        request body object true "Comment" SchemaExample({"comment": "Test comment"})
// @Success      200  {object}  map[string]string "status: success"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/{id}/comment [put]
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

// UpdateCrashTags godoc
// @Summary      Update crash tags
// @Description  Update tags for a specific crash/bug
// @Tags         bugs
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Crash ID"
// @Param        request body object true "Tags array" SchemaExample({"tags": ["tag1", "tag2"]})
// @Success      200  {object}  map[string]string "status: success"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /bugs/{id}/tags [put]
func (h *FuzzTraceHandler) UpdateCrashTags(c *gin.Context) {
	crashID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid crash ID"})
		return
	}

	var request struct {
		Tags []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.service.UpdateCrashTags(c.Request.Context(), crashID, request.Tags)
	if err != nil {
		slog.Error("Failed to update crash tags", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// UpdateCrashComment godoc
// @Summary      Update crash comment
// @Description  Update comment for a specific crash/bug
// @Tags         bugs
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Crash ID"
// @Param        request body object true "Comment" SchemaExample({"comment": "Test comment"})
// @Success      200  {object}  map[string]string "status: success"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /bugs/{id}/comment [put]
func (h *FuzzTraceHandler) UpdateCrashComment(c *gin.Context) {
	crashID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid crash ID"})
		return
	}

	var request struct {
		Comment *string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.service.UpdateCrashComment(c.Request.Context(), crashID, request.Comment)
	if err != nil {
		slog.Error("Failed to update crash comment", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// DeleteRun godoc
// @Summary      Delete fuzzer run
// @Description  Delete a specific fuzzer run by ID
// @Tags         runs
// @Produce      json
// @Param        id   path      int  true  "Run ID"
// @Success      200  {object}  map[string]string "status: success"
// @Failure      400  {object}  map[string]string "error message"
// @Failure      500  {object}  map[string]string "error message"
// @Router       /runs/{id} [delete]
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

// GetFuzzerRunsBySearchPatternWithTags godoc
// @Summary      Search fuzzer runs by date range and tags
// @Description  Get fuzzer runs filtered by date range and tags
// @Tags         runs
// @Produce      json
// @Param        fromdate  query     string  false  "Start date (YYYY-MM-DD)"
// @Param        todate    query     string  false  "End date (YYYY-MM-DD)"
// @Param        tags      query     string  false  "Comma-separated list of tags"
// @Success      200       {array}   dto.MetadataWithId
// @Failure      400       {object}  map[string]string "error message"
// @Failure      500       {object}  map[string]string "error message"
// @Router       /runs/search-with-tags [get]
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
