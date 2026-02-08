package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BudgetRepository struct {
	pool *pgxpool.Pool
}

func NewBudgetRepository(pool *pgxpool.Pool) *BudgetRepository {
	return &BudgetRepository{pool: pool}
}

// Upsert crea o actualiza un presupuesto (UPSERT = INSERT o UPDATE si ya existe).
// Usamos ON CONFLICT porque solo puede haber un presupuesto por categoría por mes.
func (r *BudgetRepository) Upsert(ctx context.Context, userID string, req models.CreateBudgetRequest) (*models.Budget, error) {
	b := &models.Budget{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO budgets (user_id, category_id, amount_limit, month, year)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id, category_id, month, year)
		 DO UPDATE SET amount_limit = $3, updated_at = NOW()
		 RETURNING id, user_id, category_id, amount_limit, month, year, created_at, updated_at`,
		userID, req.CategoryID, req.AmountLimit, req.Month, req.Year,
	).Scan(&b.ID, &b.UserID, &b.CategoryID, &b.AmountLimit, &b.Month, &b.Year, &b.CreatedAt, &b.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error guardando presupuesto: %w", err)
	}
	return b, nil
}

// GetByPeriod devuelve los presupuestos de un mes/año con el monto gastado calculado.
// Esta query es la más compleja: hace JOIN con categories y un subquery para
// calcular cuánto se ha gastado en cada categoría en ese mes.
func (r *BudgetRepository) GetByPeriod(ctx context.Context, userID string, month, year int) ([]models.Budget, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT
			b.id, b.user_id, b.category_id, c.name, c.color, c.icon,
			b.amount_limit,
			COALESCE(
				(SELECT SUM(t.amount)
				 FROM transactions t
				 WHERE t.user_id = b.user_id
				   AND t.category_id = b.category_id
				   AND t.type = 'expense'
				   AND EXTRACT(MONTH FROM t.date) = $2
				   AND EXTRACT(YEAR FROM t.date) = $3
				), 0
			) as spent,
			b.month, b.year, b.created_at, b.updated_at
		 FROM budgets b
		 JOIN categories c ON b.category_id = c.id
		 WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
		 ORDER BY c.name`,
		userID, month, year,
	)
	if err != nil {
		return nil, fmt.Errorf("error consultando presupuestos: %w", err)
	}
	defer rows.Close()

	var budgets []models.Budget
	for rows.Next() {
		var b models.Budget
		err := rows.Scan(
			&b.ID, &b.UserID, &b.CategoryID, &b.CategoryName, &b.CategoryColor, &b.CategoryIcon,
			&b.AmountLimit, &b.Spent, &b.Month, &b.Year, &b.CreatedAt, &b.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error leyendo presupuesto: %w", err)
		}
		budgets = append(budgets, b)
	}

	return budgets, nil
}

// Delete elimina un presupuesto.
func (r *BudgetRepository) Delete(ctx context.Context, id, userID string) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM budgets WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("error eliminando presupuesto: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("presupuesto no encontrado")
	}
	return nil
}
