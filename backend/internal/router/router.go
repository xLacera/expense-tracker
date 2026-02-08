// Package router define todas las rutas (URLs) de la API.
// Aquí se conectan los handlers con sus URLs y se aplican los middlewares.
package router

import (
	"log"
	"net/http"

	"expense-tracker-backend/internal/email"
	"expense-tracker-backend/internal/handlers"
	"expense-tracker-backend/internal/middleware"
	"expense-tracker-backend/internal/repository"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Setup crea y configura el router de Gin con todas las rutas.
// corsOrigin permite agregar dominios adicionales para CORS (producción).
// resendAPIKey es la clave de Resend para enviar emails (puede estar vacía en dev).
func Setup(pool *pgxpool.Pool, jwtSecret string, corsOrigin string, resendAPIKey string) *gin.Engine {
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
	savingsRepo := repository.NewSavingsRepository(pool)
	passwordResetRepo := repository.NewPasswordResetRepository(pool)

	// --- Crear servicio de email (Resend) ---
	var emailService *email.ResendService
	if resendAPIKey != "" {
		emailService = email.NewResendService(resendAPIKey)
		log.Println("Servicio de email (Resend) configurado correctamente")
	} else {
		log.Println("RESEND_API_KEY no configurada — el envío de emails estará deshabilitado")
	}

	// --- Crear services ---
	authService := services.NewAuthService(userRepo, categoryRepo, passwordResetRepo, emailService, jwtSecret)
	categoryService := services.NewCategoryService(categoryRepo)
	transactionService := services.NewTransactionService(transactionRepo)
	budgetService := services.NewBudgetService(budgetRepo)
	reportService := services.NewReportService(reportRepo)
	savingsService := services.NewSavingsService(savingsRepo)

	// --- Crear handlers ---
	authHandler := handlers.NewAuthHandler(authService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	budgetHandler := handlers.NewBudgetHandler(budgetService)
	reportHandler := handlers.NewReportHandler(reportService)
	savingsHandler := handlers.NewSavingsHandler(savingsService)

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
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
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

		// Cuentas de ahorro
		savings := protected.Group("/savings")
		{
			savings.GET("", savingsHandler.GetAll)
			savings.POST("", savingsHandler.Create)
			savings.PUT("/:id", savingsHandler.Update)
			savings.POST("/:id/adjust", savingsHandler.AdjustBalance)
			savings.DELETE("/:id", savingsHandler.Delete)
		}
	}

	return router
}
