package handlers

import (
	"net/http"
	"strconv"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService *services.TransactionService
}

func NewTransactionHandler(transactionService *services.TransactionService) *TransactionHandler {
	return &TransactionHandler{transactionService: transactionService}
}

// GetAll maneja GET /api/transactions?type=expense&category_id=xxx&date_from=2026-01-01&date_to=2026-01-31&page=1&limit=20
func (h *TransactionHandler) GetAll(c *gin.Context) {
	userID := c.GetString("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := models.TransactionFilter{
		UserID:     userID,
		Type:       c.Query("type"),
		CategoryID: c.Query("category_id"),
		DateFrom:   c.Query("date_from"),
		DateTo:     c.Query("date_to"),
		Page:       page,
		Limit:      limit,
	}

	response, err := h.transactionService.GetFiltered(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_servidor",
			"message": "Error obteniendo transacciones",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Create maneja POST /api/transactions
func (h *TransactionHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	transaction, err := h.transactionService.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_creando",
			"message": "Error creando transacción: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

// Update maneja PUT /api/transactions/:id
func (h *TransactionHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	transactionID := c.Param("id")

	var req models.UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	transaction, err := h.transactionService.Update(c.Request.Context(), transactionID, userID, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_encontrada",
			"message": "Transacción no encontrada o no tienes permiso",
		})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// Delete maneja DELETE /api/transactions/:id
func (h *TransactionHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	transactionID := c.Param("id")

	err := h.transactionService.Delete(c.Request.Context(), transactionID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_encontrada",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transacción eliminada exitosamente"})
}

// ExportCSV maneja GET /api/transactions/export
// Devuelve un archivo CSV descargable con todas las transacciones.
func (h *TransactionHandler) ExportCSV(c *gin.Context) {
	userID := c.GetString("user_id")

	filter := models.TransactionFilter{
		UserID:   userID,
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
	}

	csv, err := h.transactionService.ExportCSV(c.Request.Context(), userID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_exportando",
			"message": "Error exportando transacciones",
		})
		return
	}

	// Configurar headers para descarga de archivo
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=transacciones.csv")
	// BOM UTF-8 para que Excel reconozca los caracteres especiales (ñ, tildes)
	c.String(http.StatusOK, "\xEF\xBB\xBF"+csv)
}
