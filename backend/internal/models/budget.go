package models

import "time"

// Budget representa un presupuesto mensual para una categoría.
// Ejemplo: "En febrero 2026, no quiero gastar más de $500.000 COP en comida"
type Budget struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	CategoryID    string    `json:"category_id"`
	CategoryName  string    `json:"category_name,omitempty"`  // Se llena con JOIN
	CategoryColor string    `json:"category_color,omitempty"` // Se llena con JOIN
	CategoryIcon  string    `json:"category_icon,omitempty"`  // Se llena con JOIN
	AmountLimit   float64   `json:"amount_limit"`
	Spent         float64   `json:"spent"`    // Cuánto se ha gastado (calculado con SUM)
	Month         int       `json:"month"`
	Year          int       `json:"year"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// CreateBudgetRequest es lo que el frontend envía para crear/actualizar un presupuesto.
type CreateBudgetRequest struct {
	CategoryID  string  `json:"category_id" binding:"required,uuid"`
	AmountLimit float64 `json:"amount_limit" binding:"required,gt=0"`
	Month       int     `json:"month" binding:"required,min=1,max=12"`
	Year        int     `json:"year" binding:"required,min=2020,max=2100"`
}
