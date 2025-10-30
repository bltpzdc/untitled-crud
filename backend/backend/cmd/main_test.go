package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

var testRouter *gin.Engine

// TestMain is run before all tests in the package
func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	err := setupDatabase()
	if err != nil {
		fmt.Printf("FATAL: Failed to connect or setup test database: %v\n", err)
		fmt.Println("Please ensure a PostgreSQL instance is running and the connection string in main.go is correct.")
		os.Exit(1)
	}

	testRouter = gin.Default()
	testRouter.POST("/text", postText(db))
	testRouter.GET("/text/:id", getText(db))

	// Run all tests
	code := m.Run()

	if db != nil {
		_, err = db.Exec("DROP TABLE IF EXISTS texts;")
		if err != nil {
			fmt.Printf("Warning: Failed to drop test table: %v\n", err)
		}
		db.Close()
	}

	os.Exit(code)
}

func TestPostAndGetSuccess(t *testing.T) {
	assert := assert.New(t)

	testText := "This is a simple test post."
	postBody, _ := json.Marshal(gin.H{"text": testText})

	req, _ := http.NewRequest(http.MethodPost, "/text", bytes.NewBuffer(postBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	testRouter.ServeHTTP(w, req)

	assert.Equal(http.StatusCreated, w.Code, "Expected HTTP 201 Created")

	var postResponse map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &postResponse)
	assert.NoError(err)
	assert.Contains(postResponse, "id")

	createdID := int(postResponse["id"].(float64))

	req, _ = http.NewRequest(http.MethodGet, "/text/"+strconv.Itoa(createdID), nil)
	w = httptest.NewRecorder()
	testRouter.ServeHTTP(w, req)

	assert.Equal(http.StatusOK, w.Code, "Expected HTTP 200 OK")

	var getResponse TextEntry
	err = json.Unmarshal(w.Body.Bytes(), &getResponse)
	assert.NoError(err)
	assert.Equal(createdID, getResponse.ID, "Retrieved ID should match created ID")
	assert.Equal(testText, getResponse.Text, "Retrieved text should match posted text")
}

func TestGetNotFound(t *testing.T) {
	assert := assert.New(t)

	nonExistentID := 999999

	req, _ := http.NewRequest(http.MethodGet, "/text/"+strconv.Itoa(nonExistentID), nil)
	w := httptest.NewRecorder()
	testRouter.ServeHTTP(w, req)

	assert.Equal(http.StatusNotFound, w.Code, "Expected HTTP 404 Not Found")

	var getResponse map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &getResponse)
	assert.NoError(err)
	expectedMsg := fmt.Sprintf("Text with id %d not found", nonExistentID)
	assert.Contains(getResponse["error"], expectedMsg)
}
