// Package main представляет собой простое REST API для работы с текстовыми записями
// @title Simple Text API
// @version 1.0
// @description REST API для сохранения и получения текстовых данных с использованием PostgreSQL
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /
// @query.collection.format multi

package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// TextEntry представляет модель текстовой записи
type TextEntry struct {
	ID   int    `json:"id" example:"1"`                                  // Уникальный идентификатор записи
	Text string `json:"text" binding:"required" example:"Пример текста"` // Текст записи (обязательное поле)
}

var db *sql.DB

func main() {
	err := setupDatabase()
	if err != nil {
		log.Fatalf("Failed to setup database: %v", err)
	}
	defer db.Close()

	router := gin.Default()

	url := ginSwagger.URL("/docs/swagger.json") // указываем правильный путь
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))

	router.Static("/docs", "./docs")

	router.POST("/text", postText(db))
	router.GET("/text/:id", getText(db))

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

// setupDatabase инициализирует подключение к PostgreSQL и создает таблицу если необходимо
func setupDatabase() error {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Println("DATABASE_URL not set, using default connection string.")
		connStr = "user=postgres password=mysecretpassword dbname=simpleapp sslmode=disable port=1200"
	}

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	if err = db.Ping(); err != nil {
		return fmt.Errorf("error pinging database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL!")

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS texts (
		id SERIAL PRIMARY KEY,
		content TEXT NOT NULL
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("error creating table: %w", err)
	}

	log.Println("Database table 'texts' ensured.")
	return nil
}

// postText создает новую текстовую запись
// @Summary Создать текстовую запись
// @Description Сохраняет новый текст в базу данных
// @Tags text
// @Accept json
// @Produce json
// @Param text body TextEntry true "Текст для сохранения"
// @Success 201 {object} map[string]interface{} "Текст успешно сохранен"
// @Failure 400 {object} map[string]string "Неверный формат запроса"
// @Failure 500 {object} map[string]string "Ошибка сервера при сохранении"
// @Router /text [post]
func postText(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newEntry TextEntry
		if err := c.ShouldBindJSON(&newEntry); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body or missing 'text' field"})
			return
		}

		sqlStatement := `INSERT INTO texts (content) VALUES ($1) RETURNING id`
		var id int
		err := db.QueryRow(sqlStatement, newEntry.Text).Scan(&id)

		if err != nil {
			log.Printf("DB INSERT error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not store text"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Text stored successfully"})
	}
}

// getText получает текстовую запись по ID
// @Summary Получить текст по ID
// @Description Возвращает текстовую запись по указанному идентификатору
// @Tags text
// @Produce json
// @Param id path int true "ID текстовой записи"
// @Success 200 {object} TextEntry "Текстовая запись"
// @Failure 400 {object} map[string]string "Неверный формат ID"
// @Failure 404 {object} map[string]string "Запись не найдена"
// @Failure 500 {object} map[string]string "Ошибка сервера при получении"
// @Router /text/{id} [get]
func getText(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		sqlStatement := `SELECT id, content FROM texts WHERE id = $1`
		row := db.QueryRow(sqlStatement, id)

		var entry TextEntry
		err = row.Scan(&entry.ID, &entry.Text)

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Text with id %d not found", id)})
				return
			}
			log.Printf("DB SELECT error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve text"})
			return
		}

		c.JSON(http.StatusOK, entry)
	}
}
