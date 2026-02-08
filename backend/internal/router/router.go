// Package router define todas las rutas (URLs) de la API.
// Aquí se conectan los handlers con sus URLs y se aplican los middlewares.
package router

import (
	"net/http"

	"expense-tracker-backend/internal/handlers"
	"expense-tracker-backend/internal/middleware"
	"expense-tracker-backend/internal/repository"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Setup crea y configura el router de Gin con todas las rutas.
// corsOrigin permite agregar dominios adicionales para CORS (producción).
func Setup(pool *pgxpool.Pool, jwtSecret string, corsOrigin string) *gin.Engine {
	router := gin.New()

	// Middlewares globales
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.LoggerMiddleware())
	router.Use(middleware.CORSMiddleware(corsOrigin))

	// --- Crear repositories ---
	userRepo := repository.NewUserRepository(pool)
	categoryRepo := repository.NewCategoryRepository(pool)
	transactionRepo := repository.NewTransactionRepository(pool)
	budgetRepo := repository.NewBudgetRepository(pool)
	reportRepo := repository.NewReportRepository(pool)

	// --- Crear services ---
	authService := services.NewAuthService(userRepo, categoryRepo, jwtSecret)
	categoryService := services.NewCategoryService(categoryRepo)
	transactionService := services.NewTransactionService(transactionRepo)
	budgetService := services.NewBudgetService(budgetRepo)
	reportService := services.NewReportService(reportRepo)

	// --- Crear handlers ---
	authHandler := handlers.NewAuthHandler(authService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	budgetHandler := handlers.NewBudgetHandler(budgetService)
	reportHandler := handlers.NewReportHandler(reportService)

	// ============================================
	// RUTAS PÚBLICAS (no requieren JWT)
	// ============================================
	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"message": "Expense Tracker API funcionando correctamente",
			})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}
	}

	// ============================================
	// RUTAS PROTEGIDAS (requieren JWT válido)
	// ============================================
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Categorías
		categories := protected.Group("/categories")
		{
			categories.GET("", categoryHandler.GetAll)
			categories.POST("", categoryHandler.Create)
			categories.PUT("/:id", categoryHandler.Update)
			categories.DELETE("/:id", categoryHandler.Delete)
		}

		// Transacciones
		transactions := protected.Group("/transactions")
		{
			transactions.GET("", transactionHandler.GetAll)
			transactions.POST("", transactionHandler.Create)
			transactions.PUT("/:id", transactionHandler.Update)
			transactions.DELETE("/:id", transactionHandler.Delete)
			transactions.GET("/export", transactionHandler.ExportCSV)
		}

		// Presupuestos
		budgets := protected.Group("/budgets")
		{
			budgets.GET("", budgetHandler.GetByPeriod)
			budgets.POST("", budgetHandler.Create)
			budgets.DELETE("/:id", budgetHandler.Delete)
		}

		// Reportes
		reports := protected.Group("/reports")
		{
			reports.GET("/monthly", reportHandler.GetMonthly)
			reports.GET("/yearly", reportHandler.GetYearly)
		}
	}

	return router
}
