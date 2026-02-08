// Package middleware contiene funciones que se ejecutan ANTES de cada petición HTTP.
// Son como "filtros" que procesan la petición antes de que llegue al handler real.
package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware configura qué dominios pueden hacer peticiones al backend.
//
// ¿Por qué necesitamos CORS? El frontend corre en un dominio distinto al backend.
// El navegador, por seguridad, bloquea peticiones entre dominios distintos.
// CORS le dice al navegador qué dominios están permitidos.
//
// El parámetro extraOrigins permite agregar dominios adicionales (producción),
// como "https://mi-app.vercel.app".
func CORSMiddleware(extraOrigins string) gin.HandlerFunc {
	// Orígenes base (desarrollo local)
	origins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
	}

	// Agregar orígenes extra de producción (separados por coma)
	if extraOrigins != "" {
		for _, origin := range strings.Split(extraOrigins, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}

	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
