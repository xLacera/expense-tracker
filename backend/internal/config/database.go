package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectDB crea un pool de conexiones a PostgreSQL.
// Un pool reutiliza conexiones en vez de abrir una nueva cada vez (más eficiente).
func ConnectDB(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("error parseando URL de DB: %w", err)
	}

	// Configurar el pool: mínimo 2 conexiones, máximo 10
	config.MinConns = 2
	config.MaxConns = 10
	config.MaxConnLifetime = time.Hour

	// Intentar conectar con timeout de 10 segundos
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("error conectando a PostgreSQL: %w", err)
	}

	// Verificar que la conexión funciona
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("error haciendo ping a PostgreSQL: %w", err)
	}

	log.Println("Conectado a PostgreSQL exitosamente")
	return pool, nil
}

// RunMigrations ejecuta los archivos SQL de migración en orden.
// Lee cada archivo .sql de la carpeta migrations/ y lo ejecuta contra la DB.
func RunMigrations(pool *pgxpool.Pool, migrationsPath string) error {
	// Leer todos los archivos .sql de la carpeta
	entries, err := os.ReadDir(migrationsPath)
	if err != nil {
		return fmt.Errorf("error leyendo carpeta de migraciones: %w", err)
	}

	// Filtrar solo archivos .sql y ordenarlos por nombre (001, 002...)
	var sqlFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			sqlFiles = append(sqlFiles, entry.Name())
		}
	}
	sort.Strings(sqlFiles)

	ctx := context.Background()

	for _, file := range sqlFiles {
		filePath := filepath.Join(migrationsPath, file)
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("error leyendo migración %s: %w", file, err)
		}

		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			return fmt.Errorf("error ejecutando migración %s: %w", file, err)
		}

		log.Printf("Migración ejecutada: %s", file)
	}

	log.Println("Todas las migraciones ejecutadas exitosamente")
	return nil
}
