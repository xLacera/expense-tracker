package handlers

import (
	"net/http"
	"strconv"

	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

// GetMonthly maneja GET /api/reports/monthly?month=2&year=2026
func (h *ReportHandler) GetMonthly(c *gin.Context) {
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

	summary, err := h.reportService.GetMonthlySummary(c.Request.Context(), userID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_servidor",
			"message": "Error generando reporte mensual",
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetYearly maneja GET /api/reports/yearly?year=2026
func (h *ReportHandler) GetYearly(c *gin.Context) {
	userID := c.GetString("user_id")

	year, err := strconv.Atoi(c.Query("year"))
	if err != nil || year < 2020 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "parametro_invalido",
			"message": "El año debe ser un número válido (>= 2020)",
		})
		return
	}

	summary, err := h.reportService.GetYearlySummary(c.Request.Context(), userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_servidor",
			"message": "Error generando reporte anual",
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}
