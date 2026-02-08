package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepository struct {
	pool *pgxpool.Pool
}

func NewReportRepository(pool *pgxpool.Pool) *ReportRepository {
	return &ReportRepository{pool: pool}
}

// GetMonthlySummary calcula el resumen financiero de un mes.
// Usa SUM + GROUP BY para obtener totales por categoría directamente en SQL.
func (r *ReportRepository) GetMonthlySummary(ctx context.Context, userID string, month, year int) (*models.MonthlySummary, error) {
	summary := &models.MonthlySummary{
		Month: month,
		Year:  year,
	}

	// Obtener totales generales (ingresos y gastos del mes)
	err := r.pool.QueryRow(ctx,
		`SELECT
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		 FROM transactions
		 WHERE user_id = $1
		   AND EXTRACT(MONTH FROM date) = $2
		   AND EXTRACT(YEAR FROM date) = $3`,
		userID, month, year,
	).Scan(&summary.TotalIncome, &summary.TotalExpense)

	if err != nil {
		return nil, fmt.Errorf("error calculando totales mensuales: %w", err)
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense

	// Obtener desglose por categoría
	rows, err := r.pool.Query(ctx,
		`SELECT c.id, c.name, c.color, t.type, SUM(t.amount) as total
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1
		   AND EXTRACT(MONTH FROM t.date) = $2
		   AND EXTRACT(YEAR FROM t.date) = $3
		 GROUP BY c.id, c.name, c.color, t.type
		 ORDER BY total DESC`,
		userID, month, year,
	)
	if err != nil {
		return nil, fmt.Errorf("error consultando resumen por categoría: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cs models.CategorySummary
		err := rows.Scan(&cs.CategoryID, &cs.CategoryName, &cs.CategoryColor, &cs.Type, &cs.Total)
		if err != nil {
			return nil, fmt.Errorf("error leyendo resumen de categoría: %w", err)
		}
		summary.ByCategory = append(summary.ByCategory, cs)
	}

	if summary.ByCategory == nil {
		summary.ByCategory = []models.CategorySummary{}
	}

	return summary, nil
}

// GetYearlySummary calcula el resumen de un año completo, mes a mes.
// Genera una fila por cada mes que tenga transacciones.
func (r *ReportRepository) GetYearlySummary(ctx context.Context, userID string, year int) (*models.YearlySummary, error) {
	summary := &models.YearlySummary{Year: year}

	rows, err := r.pool.Query(ctx,
		`SELECT
			EXTRACT(MONTH FROM date)::int as month,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
		 FROM transactions
		 WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
		 GROUP BY EXTRACT(MONTH FROM date)
		 ORDER BY month`,
		userID, year,
	)
	if err != nil {
		return nil, fmt.Errorf("error consultando resumen anual: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var mt models.MonthlyTotals
		err := rows.Scan(&mt.Month, &mt.TotalIncome, &mt.TotalExpense)
		if err != nil {
			return nil, fmt.Errorf("error leyendo totales mensuales: %w", err)
		}
		mt.Balance = mt.TotalIncome - mt.TotalExpense
		summary.TotalIncome += mt.TotalIncome
		summary.TotalExpense += mt.TotalExpense
		summary.Monthly = append(summary.Monthly, mt)
	}

	summary.Balance = summary.TotalIncome - summary.TotalExpense

	if summary.Monthly == nil {
		summary.Monthly = []models.MonthlyTotals{}
	}

	return summary, nil
}
