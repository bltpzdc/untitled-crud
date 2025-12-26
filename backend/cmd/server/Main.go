package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/metametamoon/untitled-crud/backend/internal/db"

	"github.com/metametamoon/untitled-crud/backend/internal/repository"
	"github.com/metametamoon/untitled-crud/backend/internal/service"
	"github.com/metametamoon/untitled-crud/backend/internal/transport"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

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

	router.POST("/v1/runs", fuzzTraceHandler.PostFuzzerRun)
	router.GET("/runs/metadatas", fuzzTraceHandler.GetFuzzerRunsMetadatas)
	router.GET("/runs/metadata/:id", fuzzTraceHandler.GetFuzzerRunMetadata)
	router.GET("/runs/archive/:id", fuzzTraceHandler.DownloadArchive)
	router.GET("/runs/details/:id", fuzzTraceHandler.GetFuzzerRunDetails)

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
