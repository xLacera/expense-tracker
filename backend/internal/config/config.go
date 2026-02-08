// Package config lee las variables de entorno y las expone como un struct.
// Centralizar la configuración aquí evita que el resto del código
// tenga que leer variables de entorno directamente (más limpio y testeable).
package config

import (
	"fmt"
	"os"
)

// Config contiene toda la configuración de la aplicación.
// Cada campo corresponde a una variable de entorno.
type Config struct {
	// Conexión directa (para producción con Neon, Supabase, etc.)
	DatabaseURL string

	// Conexión por partes (para desarrollo local con Docker)
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresHost     string
	PostgresPort     string

	BackendPort string
	JWTSecret   string
	GinMode     string

	// CORS: orígenes permitidos (para producción)
	CORSOrigin string
}

// Load lee todas las variables de entorno y devuelve un Config.
// Si alguna variable obligatoria falta, devuelve un error.
func Load() (*Config, error) {
	cfg := &Config{
		// Si DATABASE_URL está definida, se usa directamente (producción)
		DatabaseURL: getEnv("DATABASE_URL", ""),

		// Variables individuales (desarrollo con Docker)
		PostgresUser:     getEnv("POSTGRES_USER", "expense_user"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", ""),
		PostgresDB:       getEnv("POSTGRES_DB", "expense_tracker"),
		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),

		BackendPort: getEnv("BACKEND_PORT", "8080"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		GinMode:     getEnv("GIN_MODE", "debug"),

		// Orígenes CORS adicionales (separados por coma)
		CORSOrigin: getEnv("CORS_ORIGIN", ""),
	}

	// En producción, DATABASE_URL reemplaza las variables individuales
	// así que solo validamos POSTGRES_PASSWORD si no hay DATABASE_URL
	if cfg.DatabaseURL == "" && cfg.PostgresPassword == "" {
		return nil, fmt.Errorf("POSTGRES_PASSWORD o DATABASE_URL es obligatoria")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET es obligatoria")
	}

	return cfg, nil
}

// GetDatabaseURL devuelve la URL de conexión a PostgreSQL.
// Si DATABASE_URL está definida (producción), la usa directamente.
// Si no, construye la URL a partir de las variables individuales (desarrollo).
func (c *Config) GetDatabaseURL() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.PostgresUser,
		c.PostgresPassword,
		c.PostgresHost,
		c.PostgresPort,
		c.PostgresDB,
	)
}

// getEnv lee una variable de entorno. Si no existe, devuelve el valor por defecto.
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
