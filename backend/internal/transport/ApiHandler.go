package transport

import (
	"net/http"
	"strconv"

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

func transfrom(input []dto.OpCrash) []model.CrashesGroupedByFailedOperation {
	var result = make([]model.CrashesGroupedByFailedOperation, 0)
	for _, op := range input {
		var x = model.CrashesGroupedByFailedOperation{
			ID:        op.ID,
			RunID:     op.RunID,
			Operation: op.Operation,
			TestCases: make([]model.TestCase, 0),
		}
		result = append(result, x)
	}
	return result
}

// TODO Ii is expected for the user to only input the zip array, so that all the  parsing is happening on the server
func (h *FuzzTraceHandler) PostFuzzerRun(c *gin.Context) {
	var request dto.StoreFuzzerRunRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var fuzzerRun = model.FuzzerRun{
		ID:                              request.ID,
		Timestamp:                       request.Timestamp,
		FailureCount:                    request.FailureCount,
		Tags:                            request.Tags,
		CrashesGroupedByFailedOperation: transfrom(request.OpCrashes),
	}

	if err := h.service.StoreFuzzerRun(c.Request.Context(), &fuzzerRun); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success"})
}

func (h *FuzzTraceHandler) GetFuzzerRun(c *gin.Context) {
	runID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid run ID"})
		return
	}

	run, err := h.service.GetRun(c.Request.Context(), runID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Run not found"})
		return
	}

	c.JSON(http.StatusOK, run)
}

func (h *FuzzTraceHandler) GetFuzzerRuns(c *gin.Context) {
	runs, err := h.service.GetRuns(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Runs not found"})
		return
	}

	// TODO: answer with an actual DTO object; currently, too much information is transferred by this request
	c.JSON(http.StatusOK, runs)
}

func (h *FuzzTraceHandler) GetAllTags(c *gin.Context) {
	tags, err := h.service.GetAllTags(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Runs not found"})
		return
	}

	c.JSON(http.StatusOK, tags)
}
