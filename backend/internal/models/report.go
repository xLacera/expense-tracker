package models

// MonthlySummary es el resumen financiero de un mes completo.
type MonthlySummary struct {
	Month        int               `json:"month"`
	Year         int               `json:"year"`
	TotalIncome  float64           `json:"total_income"`
	TotalExpense float64           `json:"total_expense"`
	Balance      float64           `json:"balance"` // income - expense
	ByCategory   []CategorySummary `json:"by_category"`
}

// CategorySummary muestra el total gastado/ganado en una categoría específica.
type CategorySummary struct {
	CategoryID    string  `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryColor string  `json:"category_color"`
	Type          string  `json:"type"`
	Total         float64 `json:"total"`
}

// YearlySummary es el resumen de un año completo, mes a mes.
type YearlySummary struct {
	Year         int              `json:"year"`
	TotalIncome  float64          `json:"total_income"`
	TotalExpense float64          `json:"total_expense"`
	Balance      float64          `json:"balance"`
	Monthly      []MonthlyTotals  `json:"monthly"`
}

// MonthlyTotals muestra los totales de un mes dentro del reporte anual.
type MonthlyTotals struct {
	Month        int     `json:"month"`
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Balance      float64 `json:"balance"`
}
