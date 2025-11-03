package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"api"
	"db"
	"model"
	"repository"
	"service"

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

    fuzzerRepo := postgres.NewFuzzerRepository(conn.Conn())
    fuzzerService := service.NewFuzzerService(fuzzerRepo)
    fuzzerHandler := handler.NewFuzzerHandler(fuzzerService)

	router := gin.Default()

	url := ginSwagger.URL("/docs/swagger.json")
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))

	router.Static("/docs", "./docs")

	router.POST("/run", fuzzerHandler.PostFuzzerRun)
	router.GET("/runs", fuzzerHandler.GetExecutionsHandler)
	router.GET("/run/:id", fuzzerHandler.GetFuzzerRun)

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
