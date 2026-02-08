package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// CategoryRepository maneja las operaciones de DB para la tabla categories.
type CategoryRepository struct {
	pool *pgxpool.Pool
}

func NewCategoryRepository(pool *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{pool: pool}
}

// GetAllByUser devuelve todas las categorías de un usuario.
func (r *CategoryRepository) GetAllByUser(ctx context.Context, userID string) ([]models.Category, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, name, nickname, color, icon, type, created_at
		 FROM categories
		 WHERE user_id = $1
		 ORDER BY type, name`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("error consultando categorías: %w", err)
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var cat models.Category
		err := rows.Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Nickname, &cat.Color, &cat.Icon, &cat.Type, &cat.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error leyendo categoría: %w", err)
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

// GetByID devuelve una categoría por su ID, verificando que pertenezca al usuario.
func (r *CategoryRepository) GetByID(ctx context.Context, id, userID string) (*models.Category, error) {
	cat := &models.Category{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, nickname, color, icon, type, created_at
		 FROM categories
		 WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Nickname, &cat.Color, &cat.Icon, &cat.Type, &cat.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("categoría no encontrada: %w", err)
	}
	return cat, nil
}

// Create inserta una nueva categoría.
func (r *CategoryRepository) Create(ctx context.Context, userID, name, color, icon, catType string) (*models.Category, error) {
	cat := &models.Category{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO categories (user_id, name, nickname, color, icon, type)
		 VALUES ($1, $2, '', $3, $4, $5)
		 RETURNING id, user_id, name, nickname, color, icon, type, created_at`,
		userID, name, color, icon, catType,
	).Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Nickname, &cat.Color, &cat.Icon, &cat.Type, &cat.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creando categoría: %w", err)
	}
	return cat, nil
}

// Update actualiza los campos de una categoría existente.
func (r *CategoryRepository) Update(ctx context.Context, id, userID, name, nickname, color, icon string) (*models.Category, error) {
	cat := &models.Category{}
	err := r.pool.QueryRow(ctx,
		`UPDATE categories
		 SET name = COALESCE(NULLIF($3, ''), name),
		     nickname = $4,
		     color = COALESCE(NULLIF($5, ''), color),
		     icon = COALESCE(NULLIF($6, ''), icon)
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, name, nickname, color, icon, type, created_at`,
		id, userID, name, nickname, color, icon,
	).Scan(&cat.ID, &cat.UserID, &cat.Name, &cat.Nickname, &cat.Color, &cat.Icon, &cat.Type, &cat.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("error actualizando categoría: %w", err)
	}
	return cat, nil
}

// Delete elimina una categoría. Solo si pertenece al usuario.
func (r *CategoryRepository) Delete(ctx context.Context, id, userID string) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM categories WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("error eliminando categoría: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("categoría no encontrada o no tienes permiso")
	}
	return nil
}
