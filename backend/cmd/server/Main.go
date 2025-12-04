package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	// _ "github.com/metametamoon/untitled-crud/backend/cmd/server/docs"

	"github.com/metametamoon/untitled-crud/backend/internal/db"
	"github.com/metametamoon/untitled-crud/backend/internal/repository"
	"github.com/metametamoon/untitled-crud/backend/internal/service"
	"github.com/metametamoon/untitled-crud/backend/internal/transport"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Untitled CRUD API
// @version 1.0
// @description API documentation for Untitled CRUD Backend

// @host localhost:8080
// @BasePath /
func main() {
	database, err := db.NewDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	fuzzTraceRepo := repository.NewFuzzTraceRepository(database.Pool)
	fuzzTraceService := service.NewFuzzTraceService(fuzzTraceRepo)
	fuzzTraceHandler := transport.NewFuzzTraceHandler(fuzzTraceService)

	router := gin.Default()

	url := ginSwagger.URL("/docs/swagger.json")
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))
	router.Static("/docs", "./docs")

	v1 := router.Group("/v1")
	{
		v1.POST("/runs", fuzzTraceHandler.PostFuzzerRun)
		v1.GET("/runs/metadatas", fuzzTraceHandler.GetFuzzerRunsMetadatas)
		v1.GET("/runs/metadatas/:id", fuzzTraceHandler.GetFuzzerRunMetadata)
		v1.GET("/runs/archives/:id", fuzzTraceHandler.DownloadArchive)
	}

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
