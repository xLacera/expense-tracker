// Handler de cuentas de ahorro — endpoints HTTP REST.
package handlers

import (
	"net/http"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type SavingsHandler struct {
	savingsService *services.SavingsService
}

func NewSavingsHandler(savingsService *services.SavingsService) *SavingsHandler {
	return &SavingsHandler{savingsService: savingsService}
}

// Create — POST /api/savings
func (h *SavingsHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var req models.CreateSavingsAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	account, err := h.savingsService.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_creando",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetAll — GET /api/savings
func (h *SavingsHandler) GetAll(c *gin.Context) {
	userID := c.GetString("user_id")

	accounts, err := h.savingsService.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_listando",
			"message": err.Error(),
		})
		return
	}

	total, err := h.savingsService.GetTotal(c.Request.Context(), userID)
	if err != nil {
		total = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
		"total":    total,
	})
}

// Update — PUT /api/savings/:id
func (h *SavingsHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	var req models.UpdateSavingsAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	account, err := h.savingsService.Update(c.Request.Context(), id, userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_actualizando",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, account)
}

// AdjustBalance — POST /api/savings/:id/adjust
func (h *SavingsHandler) AdjustBalance(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	var req models.AdjustBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	account, err := h.savingsService.AdjustBalance(c.Request.Context(), id, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "error_ajustando",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, account)
}

// Delete — DELETE /api/savings/:id
func (h *SavingsHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	if err := h.savingsService.Delete(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_eliminando",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cuenta de ahorro eliminada"})
}
