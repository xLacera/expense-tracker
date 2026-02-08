package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse es el formato estándar de error que devuelve la API.
// Siempre devolvemos errores en el mismo formato para que el frontend
// sepa exactamente qué esperar.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// ErrorHandler es un middleware que captura panics (errores fatales) y
// los convierte en respuestas JSON en vez de crashear el servidor.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC recuperado: %v", err)
				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error:   "internal_server_error",
					Message: "Ocurrió un error interno del servidor",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
