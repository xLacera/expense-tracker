// Punto de entrada de la aplicación backend.
// Aquí se conecta todo: configuración, base de datos, migraciones y servidor HTTP.
package main

import (
	"log"
	"os"

	"expense-tracker-backend/internal/config"
	"expense-tracker-backend/internal/router"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Cargar configuración desde variables de entorno
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Error cargando configuración: %v", err)
	}

	// 2. Configurar modo de Gin (debug o release)
	gin.SetMode(cfg.GinMode)

	// 3. Conectar a PostgreSQL
	pool, err := config.ConnectDB(cfg.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Error conectando a base de datos: %v", err)
	}
	defer pool.Close()

	// 4. Ejecutar migraciones SQL (crear tablas si no existen)
	migrationsPath := "migrations"
	if _, err := os.Stat(migrationsPath); err == nil {
		if err := config.RunMigrations(pool, migrationsPath); err != nil {
			log.Fatalf("Error ejecutando migraciones: %v", err)
		}
	} else {
		log.Println("Carpeta de migraciones no encontrada, saltando...")
	}

	// 5. Configurar router con todas las rutas
	r := router.Setup(pool, cfg.JWTSecret, cfg.CORSOrigin, cfg.ResendAPIKey)

	// 6. Iniciar servidor HTTP
	log.Printf("Servidor iniciando en puerto %s...", cfg.BackendPort)
	if err := r.Run(":" + cfg.BackendPort); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}
