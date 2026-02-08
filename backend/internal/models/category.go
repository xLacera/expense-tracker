package models

import "time"

// Category representa una categoría de gasto o ingreso.
// Cada usuario tiene sus propias categorías (comida, transporte, salario, etc.)
type Category struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"` // Color hex: "#6366f1"
	Icon      string    `json:"icon"`  // Nombre del ícono: "utensils", "car", etc.
	Type      string    `json:"type"`  // "income" o "expense"
	CreatedAt time.Time `json:"created_at"`
}

// CreateCategoryRequest es lo que el frontend envía para crear una categoría.
type CreateCategoryRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=100"`
	Color string `json:"color" binding:"required,len=7"`  // "#RRGGBB"
	Icon  string `json:"icon" binding:"required,min=1"`
	Type  string `json:"type" binding:"required,oneof=income expense"`
}

// UpdateCategoryRequest permite actualizar campos de una categoría.
type UpdateCategoryRequest struct {
	Name  string `json:"name" binding:"omitempty,min=1,max=100"`
	Color string `json:"color" binding:"omitempty,len=7"`
	Icon  string `json:"icon" binding:"omitempty,min=1"`
}
