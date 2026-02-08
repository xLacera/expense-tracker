// Package handlers contiene los controladores HTTP.
// Cada handler recibe una petición HTTP, extrae los datos,
// llama al service correspondiente, y devuelve una respuesta JSON.
package handlers

import (
	"log"
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
		// Diferenciar: email no encontrado (404) vs contraseña incorrecta (401)
		if err == services.ErrEmailNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "email_no_registrado",
				"message": err.Error(),
			})
		} else if err == services.ErrWrongPassword {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "password_incorrecta",
				"message": err.Error(),
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "login_fallido",
				"message": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, response)
}

// ForgotPassword maneja POST /api/auth/forgot-password
// El frontend envía: { email }
// El backend genera un OTP, lo guarda en DB, y lo envía por email.
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req models.ForgotPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Ingresa un correo electrónico válido",
		})
		return
	}

	err := h.authService.ForgotPassword(c.Request.Context(), req)
	if err != nil {
		// Log el error real para depuración (Render, logs del servidor)
		log.Printf("[ForgotPassword] error enviando OTP a %s: %v", req.Email, err)
		// Mensaje genérico al usuario (no exponer detalles internos ni Resend)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_envio",
			"message": "No pudimos enviar el código por correo. El servicio de email puede no estar configurado; intenta más tarde o contacta al administrador.",
		})
		return
	}

	// Siempre responder éxito (por seguridad, no revelar si el email existe)
	c.JSON(http.StatusOK, gin.H{
		"message": "Si el correo está registrado, recibirás un código de verificación",
	})
}

// ResetPassword maneja POST /api/auth/reset-password
// El frontend envía: { email, otp, new_password }
// El backend verifica el OTP y actualiza la contraseña.
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: correo válido, código de 6 dígitos, y contraseña mínimo 6 caracteres",
		})
		return
	}

	err := h.authService.ResetPassword(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "reset_fallido",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión",
	})
}
