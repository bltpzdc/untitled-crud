package main

//var testRouter *gin.Engine

// TestMain is run before all tests in the package
//func TestMain(m *testing.M) {
//	gin.SetMode(gin.TestMode)
//	err := setupDatabase()
//	if err != nil {
//		fmt.Printf("FATAL: Failed to connect or setup test database: %v\n", err)
//		fmt.Println("Please ensure a PostgreSQL instance is running and the connection string in main.go is correct.")
//		os.Exit(1)
//	}
//
//	testRouter = gin.Default()
//	testRouter.POST("/text", postText(server.db))
//	testRouter.GET("/text/:id", getText(server.db))
//
//	// Run all tests
//	code := m.Run()
//
//	if db != nil {
//		_, err = db.Exec("DROP TABLE IF EXISTS texts;")
//		if err != nil {
//			fmt.Printf("Warning: Failed to drop test table: %v\n", err)
//		}
//		db.Close()
//	}
//
//	os.Exit(code)
//}
