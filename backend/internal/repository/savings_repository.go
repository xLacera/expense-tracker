// Repository de cuentas de ahorro — operaciones SQL puras.
package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SavingsRepository struct {
	pool *pgxpool.Pool
}

func NewSavingsRepository(pool *pgxpool.Pool) *SavingsRepository {
	return &SavingsRepository{pool: pool}
}

// Create inserta una nueva cuenta de ahorro.
func (r *SavingsRepository) Create(ctx context.Context, userID, name string, balance float64, color, icon, notes string) (*models.SavingsAccount, error) {
	acc := &models.SavingsAccount{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO savings_accounts (user_id, name, balance, color, icon, notes)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, name, balance, color, icon, notes, created_at, updated_at`,
		userID, name, balance, color, icon, notes,
	).Scan(&acc.ID, &acc.UserID, &acc.Name, &acc.Balance, &acc.Color, &acc.Icon, &acc.Notes, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creando cuenta de ahorro: %w", err)
	}
	return acc, nil
}

// GetAllByUser devuelve todas las cuentas de ahorro de un usuario.
func (r *SavingsRepository) GetAllByUser(ctx context.Context, userID string) ([]models.SavingsAccount, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, name, balance, color, icon, notes, created_at, updated_at
		 FROM savings_accounts WHERE user_id = $1
		 ORDER BY created_at ASC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("error listando cuentas de ahorro: %w", err)
	}
	defer rows.Close()

	var accounts []models.SavingsAccount
	for rows.Next() {
		var acc models.SavingsAccount
		if err := rows.Scan(&acc.ID, &acc.UserID, &acc.Name, &acc.Balance, &acc.Color, &acc.Icon, &acc.Notes, &acc.CreatedAt, &acc.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error escaneando cuenta de ahorro: %w", err)
		}
		accounts = append(accounts, acc)
	}
	return accounts, nil
}

// GetByID devuelve una cuenta de ahorro por su ID (verificando que sea del usuario).
func (r *SavingsRepository) GetByID(ctx context.Context, id, userID string) (*models.SavingsAccount, error) {
	acc := &models.SavingsAccount{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, balance, color, icon, notes, created_at, updated_at
		 FROM savings_accounts WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&acc.ID, &acc.UserID, &acc.Name, &acc.Balance, &acc.Color, &acc.Icon, &acc.Notes, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("cuenta de ahorro no encontrada: %w", err)
	}
	return acc, nil
}

// Update actualiza una cuenta de ahorro.
func (r *SavingsRepository) Update(ctx context.Context, id, userID, name string, balance float64, color, icon, notes string) (*models.SavingsAccount, error) {
	acc := &models.SavingsAccount{}
	err := r.pool.QueryRow(ctx,
		`UPDATE savings_accounts
		 SET name = $3, balance = $4, color = $5, icon = $6, notes = $7, updated_at = NOW()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, name, balance, color, icon, notes, created_at, updated_at`,
		id, userID, name, balance, color, icon, notes,
	).Scan(&acc.ID, &acc.UserID, &acc.Name, &acc.Balance, &acc.Color, &acc.Icon, &acc.Notes, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error actualizando cuenta de ahorro: %w", err)
	}
	return acc, nil
}

// AdjustBalance suma o resta dinero al balance de una cuenta.
func (r *SavingsRepository) AdjustBalance(ctx context.Context, id, userID string, amount float64) (*models.SavingsAccount, error) {
	acc := &models.SavingsAccount{}
	err := r.pool.QueryRow(ctx,
		`UPDATE savings_accounts
		 SET balance = balance + $3, updated_at = NOW()
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, name, balance, color, icon, notes, created_at, updated_at`,
		id, userID, amount,
	).Scan(&acc.ID, &acc.UserID, &acc.Name, &acc.Balance, &acc.Color, &acc.Icon, &acc.Notes, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error ajustando balance: %w", err)
	}
	return acc, nil
}

// Delete elimina una cuenta de ahorro.
func (r *SavingsRepository) Delete(ctx context.Context, id, userID string) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM savings_accounts WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("error eliminando cuenta de ahorro: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("cuenta de ahorro no encontrada")
	}
	return nil
}

// GetTotalByUser devuelve el total de ahorro del usuario (suma de todos los balances).
func (r *SavingsRepository) GetTotalByUser(ctx context.Context, userID string) (float64, error) {
	var total float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(balance), 0) FROM savings_accounts WHERE user_id = $1`,
		userID,
	).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error calculando total de ahorros: %w", err)
	}
	return total, nil
}
