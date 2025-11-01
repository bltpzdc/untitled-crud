package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/metametamoon/untitled-crud/backend/internal/api"
	"github.com/metametamoon/untitled-crud/backend/internal/model"
	"github.com/metametamoon/untitled-crud/backend/internal/repository"
	"github.com/metametamoon/untitled-crud/backend/internal/service"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {

	router := gin.Default()

	url := ginSwagger.URL("/docs/swagger.json")
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))

	router.Static("/docs", "./docs")

	whiteService, err := service.NewWhiteService(
		repository.ArrayRepository{AnalyzerExecutions: make([]model.AnalyzerExecution, 0)},
	)
	if err != nil {
		log.Fatal(err)
	}

	handler := api.NewWhiteHandler(whiteService)

	router.POST("/execution", handler.PostExecutionHandler)
	router.GET("/executions", handler.GetExecutionsHandler)
	router.GET("/execution/:id", handler.GetExecutionHandler)

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
