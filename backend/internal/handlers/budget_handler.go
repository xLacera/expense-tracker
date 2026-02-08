package handlers

import (
	"net/http"
	"strconv"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type BudgetHandler struct {
	budgetService *services.BudgetService
}

func NewBudgetHandler(budgetService *services.BudgetService) *BudgetHandler {
	return &BudgetHandler{budgetService: budgetService}
}

// Create maneja POST /api/budgets - Crea o actualiza un presupuesto mensual
func (h *BudgetHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	budget, err := h.budgetService.Upsert(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_creando",
			"message": "Error guardando presupuesto: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, budget)
}

// GetByPeriod maneja GET /api/budgets?month=2&year=2026
func (h *BudgetHandler) GetByPeriod(c *gin.Context) {
	userID := c.GetString("user_id")

	month, err := strconv.Atoi(c.Query("month"))
	if err != nil || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "parametro_invalido",
			"message": "El mes debe ser un número entre 1 y 12",
		})
		return
	}

	year, err := strconv.Atoi(c.Query("year"))
	if err != nil || year < 2020 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "parametro_invalido",
			"message": "El año debe ser un número válido (>= 2020)",
		})
		return
	}

	budgets, err := h.budgetService.GetByPeriod(c.Request.Context(), userID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_servidor",
			"message": "Error obteniendo presupuestos",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"budgets": budgets})
}

// Delete maneja DELETE /api/budgets/:id
func (h *BudgetHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	budgetID := c.Param("id")

	err := h.budgetService.Delete(c.Request.Context(), budgetID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_encontrado",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Presupuesto eliminado exitosamente"})
}
