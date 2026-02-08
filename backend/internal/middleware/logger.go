package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware registra cada petición HTTP que llega al servidor.
// Esto es útil para debugging: puedes ver qué peticiones llegan,
// cuánto tardan, y si devolvieron error.
//
// Ejemplo de salida: "POST /api/auth/login | 200 | 45ms"
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Procesar la petición
		c.Next()

		// Después de procesar, registrar los detalles
		duration := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path

		log.Printf("%s %s | %d | %v", method, path, status, duration)
	}
}
