package api

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/metametamoon/untitled-crud/backend/internal/service"
)

type WhiteHandler struct {
	whiteService service.WhiteService
}

func NewWhiteHandler(whiteService service.WhiteService) *WhiteHandler {
	return &WhiteHandler{whiteService: whiteService}
}

func (h *WhiteHandler) GetExecutionHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Id supplied"})
		return
	}

	execution, err := h.whiteService.GetExecution(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to retrieve execution: %v", err)})
		return
	}

	if execution == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Execution not found"})
		return
	}

	zipFile, err := os.Open(execution.ZipArchivePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to open zip file: %v", err)})
		return
	}
	defer zipFile.Close()

	fileInfo, err := zipFile.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get zip file info: %v", err)})
		return
	}

	c.DataFromReader(http.StatusOK, fileInfo.Size(), "application/zip", zipFile, nil)
}

func (h *WhiteHandler) GetExecutionsHandler(c *gin.Context) {
	executions, err := h.whiteService.GetStoredExecutions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to retrieve executions: %v", err)})
		return
	}
	c.JSON(http.StatusOK, executions)
}

func (h *WhiteHandler) PostExecutionHandler(c *gin.Context) {
	file, err := c.FormFile("archive")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Failed to get archive file: %v", err)})
		return
	}

	tempFilePath := fmt.Sprintf("/tmp/%s", file.Filename)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save uploaded file: %v", err)})
		return
	}
	defer os.Remove(tempFilePath)

	executionID, err := h.whiteService.StoreExecution(tempFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to store execution: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Execution stored successfully", "id": executionID})
}
