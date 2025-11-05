package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"github.com/metametamoon/untitled-crud/backend/db"
	"github.com/metametamoon/untitled-crud/backend/internal/api"
	"github.com/metametamoon/untitled-crud/backend/internal/repository"
	"github.com/metametamoon/untitled-crud/backend/internal/service"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	database, err := db.NewDB()
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer database.Close()

    conn, err := database.Pool.Acquire(context.Background())
    if err != nil {
        log.Fatal("Failed to acquire connection:", err)
    }
    defer conn.Release()

    fuzzTraceRepo := repository.NewFuzzTraceRepository(conn.Conn())
    fuzzTraceService := service.NewFuzzTraceService(fuzzTraceRepo)
    fuzzTraceHandler := api.NewFuzzTraceHandler(fuzzTraceService)

	router := gin.Default()

	url := ginSwagger.URL("/docs/swagger.json")
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))

	router.Static("/docs", "./docs")

	router.POST("/run", fuzzTraceHandler.PostFuzzerRun)
	router.GET("/runs", fuzzTraceHandler.GetFuzzerRuns)
	router.GET("/run/:id", fuzzTraceHandler.GetFuzzerRun)

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
