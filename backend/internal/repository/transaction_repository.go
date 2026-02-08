package repository

import (
	"context"
	"fmt"
	"strings"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TransactionRepository struct {
	pool *pgxpool.Pool
}

func NewTransactionRepository(pool *pgxpool.Pool) *TransactionRepository {
	return &TransactionRepository{pool: pool}
}

// GetFiltered devuelve transacciones filtradas con paginación.
func (r *TransactionRepository) GetFiltered(ctx context.Context, filter models.TransactionFilter) ([]models.Transaction, int, error) {
	baseQuery := `
		FROM transactions t
		JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1`

	args := []interface{}{filter.UserID}
	argIndex := 2

	if filter.Type != "" {
		baseQuery += fmt.Sprintf(" AND t.type = $%d", argIndex)
		args = append(args, filter.Type)
		argIndex++
	}

	if filter.CategoryID != "" {
		baseQuery += fmt.Sprintf(" AND t.category_id = $%d", argIndex)
		args = append(args, filter.CategoryID)
		argIndex++
	}

	if filter.DateFrom != "" {
		baseQuery += fmt.Sprintf(" AND t.date >= $%d", argIndex)
		args = append(args, filter.DateFrom)
		argIndex++
	}

	if filter.DateTo != "" {
		baseQuery += fmt.Sprintf(" AND t.date <= $%d", argIndex)
		args = append(args, filter.DateTo)
		argIndex++
	}

	var total int
	countQuery := "SELECT COUNT(*) " + baseQuery
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error contando transacciones: %w", err)
	}

	selectQuery := `SELECT t.id, t.user_id, t.category_id, c.name, c.nickname, c.color, c.icon,
		t.amount, t.type, t.description, t.date, t.currency, t.created_at, t.updated_at ` +
		baseQuery + " ORDER BY t.date DESC, t.created_at DESC"

	offset := (filter.Page - 1) * filter.Limit
	selectQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filter.Limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("error consultando transacciones: %w", err)
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		err := rows.Scan(
			&t.ID, &t.UserID, &t.CategoryID, &t.CategoryName, &t.CategoryNickname, &t.CategoryColor, &t.CategoryIcon,
			&t.Amount, &t.Type, &t.Description, &t.Date, &t.Currency,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error leyendo transacción: %w", err)
		}
		t.FormatDate()
		transactions = append(transactions, t)
	}

	return transactions, total, nil
}

// GetAllForExport devuelve TODAS las transacciones del usuario (sin paginación) para CSV.
func (r *TransactionRepository) GetAllForExport(ctx context.Context, userID string, filter models.TransactionFilter) ([]models.Transaction, error) {
	baseQuery := `
		SELECT t.id, t.user_id, t.category_id, c.name, c.nickname, c.color, c.icon,
			t.amount, t.type, t.description, t.date, t.currency, t.created_at, t.updated_at
		FROM transactions t
		JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1`

	args := []interface{}{userID}
	argIndex := 2

	if filter.DateFrom != "" {
		baseQuery += fmt.Sprintf(" AND t.date >= $%d", argIndex)
		args = append(args, filter.DateFrom)
		argIndex++
	}

	if filter.DateTo != "" {
		baseQuery += fmt.Sprintf(" AND t.date <= $%d", argIndex)
		args = append(args, filter.DateTo)
		argIndex++
	}

	_ = argIndex

	baseQuery += " ORDER BY t.date DESC"

	rows, err := r.pool.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("error consultando transacciones para export: %w", err)
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		err := rows.Scan(
			&t.ID, &t.UserID, &t.CategoryID, &t.CategoryName, &t.CategoryNickname, &t.CategoryColor, &t.CategoryIcon,
			&t.Amount, &t.Type, &t.Description, &t.Date, &t.Currency,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error leyendo transacción: %w", err)
		}
		t.FormatDate()
		transactions = append(transactions, t)
	}

	return transactions, nil
}

// Create inserta una nueva transacción.
func (r *TransactionRepository) Create(ctx context.Context, userID string, req models.CreateTransactionRequest) (*models.Transaction, error) {
	currency := req.Currency
	if currency == "" {
		currency = "COP"
	}

	t := &models.Transaction{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO transactions (user_id, category_id, amount, type, description, date, currency)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, user_id, category_id, amount, type, description, date, currency, created_at, updated_at`,
		userID, req.CategoryID, req.Amount, req.Type, req.Description, req.Date, currency,
	).Scan(&t.ID, &t.UserID, &t.CategoryID, &t.Amount, &t.Type, &t.Description, &t.Date, &t.Currency, &t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creando transacción: %w", err)
	}
	t.FormatDate()
	return t, nil
}

// Update actualiza una transacción existente.
func (r *TransactionRepository) Update(ctx context.Context, id, userID string, req models.UpdateTransactionRequest) (*models.Transaction, error) {
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.CategoryID != "" {
		sets = append(sets, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, req.CategoryID)
		argIndex++
	}
	if req.Amount > 0 {
		sets = append(sets, fmt.Sprintf("amount = $%d", argIndex))
		args = append(args, req.Amount)
		argIndex++
	}
	if req.Type != "" {
		sets = append(sets, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, req.Type)
		argIndex++
	}
	if req.Description != "" {
		sets = append(sets, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, req.Description)
		argIndex++
	}
	if req.Date != "" {
		sets = append(sets, fmt.Sprintf("date = $%d", argIndex))
		args = append(args, req.Date)
		argIndex++
	}
	if req.Currency != "" {
		sets = append(sets, fmt.Sprintf("currency = $%d", argIndex))
		args = append(args, req.Currency)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no se proporcionaron campos para actualizar")
	}

	sets = append(sets, "updated_at = NOW()")

	query := fmt.Sprintf(
		`UPDATE transactions SET %s WHERE id = $%d AND user_id = $%d
		 RETURNING id, user_id, category_id, amount, type, description, date, currency, created_at, updated_at`,
		strings.Join(sets, ", "), argIndex, argIndex+1,
	)
	args = append(args, id, userID)

	t := &models.Transaction{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&t.ID, &t.UserID, &t.CategoryID, &t.Amount, &t.Type, &t.Description,
		&t.Date, &t.Currency, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error actualizando transacción: %w", err)
	}
	t.FormatDate()
	return t, nil
}

// Delete elimina una transacción del usuario.
func (r *TransactionRepository) Delete(ctx context.Context, id, userID string) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("error eliminando transacción: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("transacción no encontrada o no tienes permiso")
	}
	return nil
}
