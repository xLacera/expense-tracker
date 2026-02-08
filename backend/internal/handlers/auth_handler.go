// Package handlers contiene los controladores HTTP.
// Cada handler recibe una petición HTTP, extrae los datos,
// llama al service correspondiente, y devuelve una respuesta JSON.
package handlers

import (
	"net/http"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// AuthHandler maneja las peticiones de autenticación (register y login).
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler crea un nuevo handler de autenticación.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register maneja POST /api/auth/register
// El frontend envía: { email, password, name }
// El backend responde: { token, user }
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest

	// Intentar parsear el JSON del body. Si falla, devolver error 400.
	// binding:"required,email" en el model hace la validación automáticamente.
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos enviados: " + err.Error(),
		})
		return
	}

	// Llamar al service que contiene la lógica de negocio
	response, err := h.authService.Register(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "registro_fallido",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// Login maneja POST /api/auth/login
// El frontend envía: { email, password }
// El backend responde: { token, user }
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos enviados: " + err.Error(),
		})
		return
	}

	response, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "login_fallido",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}
