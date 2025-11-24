package transport

import (
	"math/rand"
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
		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error()})
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "id": runId})
}

func (h *FuzzTraceHandler) GetFuzzerRunMetadata(c *gin.Context) {
	panic("implement me")
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

func (h *FuzzTraceHandler) GetFuzzerRunsMetadatas(c *gin.Context) {
	panic("implement me")
}

func (h *FuzzTraceHandler) DownloadArchive(c *gin.Context) {
}
