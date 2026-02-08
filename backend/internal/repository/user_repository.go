// Package repository contiene todas las operaciones de base de datos.
// Cada repository se encarga de UNA tabla. Aquí solo hay SQL puro.
// No hay lógica de negocio, solo lectura/escritura a PostgreSQL.
package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository maneja las operaciones de DB para la tabla users.
type UserRepository struct {
	pool *pgxpool.Pool
}

// NewUserRepository crea una nueva instancia del repository.
// Recibe el pool de conexiones para poder hablar con la DB.
func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

// Create inserta un nuevo usuario en la base de datos.
// Retorna el usuario creado con su ID generado por PostgreSQL.
func (r *UserRepository) Create(ctx context.Context, email, passwordHash, name string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name)
		 VALUES ($1, $2, $3)
		 RETURNING id, email, password_hash, name, include_savings_in_total, created_at, updated_at`,
		email, passwordHash, name,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.IncludeSavingsInTotal, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creando usuario: %w", err)
	}
	return user, nil
}

// GetByEmail busca un usuario por su email.
// Se usa en login para verificar credenciales.
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, COALESCE(include_savings_in_total, true), created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.IncludeSavingsInTotal, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("usuario no encontrado: %w", err)
	}
	return user, nil
}

// GetByID busca un usuario por su ID (UUID).
// Se usa en el middleware de auth para validar el token.
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, COALESCE(include_savings_in_total, true), created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.IncludeSavingsInTotal, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("usuario no encontrado: %w", err)
	}
	return user, nil
}

// UpdatePassword actualiza el password_hash de un usuario.
// Se usa en el flujo de restablecer contraseña.
func (r *UserRepository) UpdatePassword(ctx context.Context, userID, newPasswordHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
		newPasswordHash, userID,
	)
	if err != nil {
		return fmt.Errorf("error actualizando contraseña: %w", err)
	}
	return nil
}

// UpdateIncludeSavingsInTotal actualiza la preferencia de incluir ahorros en el dinero total.
func (r *UserRepository) UpdateIncludeSavingsInTotal(ctx context.Context, userID string, value bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE users SET include_savings_in_total = $1, updated_at = NOW() WHERE id = $2`,
		value, userID,
	)
	if err != nil {
		return fmt.Errorf("error actualizando preferencia: %w", err)
	}
	return nil
}
