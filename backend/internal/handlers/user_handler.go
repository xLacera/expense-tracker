// Package handlers — UserHandler maneja preferencias del usuario (settings).
package handlers

import (
	"net/http"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

// UserHandler maneja GET/PATCH de configuración del usuario autenticado.
type UserHandler struct {
	userRepo *repository.UserRepository
}

// NewUserHandler crea un nuevo handler de usuario.
func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

// GetSettings devuelve las preferencias del usuario (GET /api/user/settings).
func (h *UserHandler) GetSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no_autorizado", "message": "Token requerido"})
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuario_no_encontrado", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.UserSettingsResponse{
		IncludeSavingsInTotal: user.IncludeSavingsInTotal,
	})
}

// UpdateSettings actualiza las preferencias (PATCH /api/user/settings).
func (h *UserHandler) UpdateSettings(c *gin.Context) {
	userID, _ := c.Get("user_id")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no_autorizado", "message": "Token requerido"})
		return
	}

	var req models.UpdateUserSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos_invalidos", "message": "Cuerpo inválido"})
		return
	}

	if req.IncludeSavingsInTotal == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos_invalidos", "message": "include_savings_in_total es requerido"})
		return
	}

	err := h.userRepo.UpdateIncludeSavingsInTotal(c.Request.Context(), userID.(string), *req.IncludeSavingsInTotal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error_actualizando", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.UserSettingsResponse{
		IncludeSavingsInTotal: *req.IncludeSavingsInTotal,
	})
}
