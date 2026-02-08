// Package models — modelo de cuentas de ahorro.
// Representa dinero guardado separado del flujo mensual de ingresos/gastos.
package models

import "time"

// SavingsAccount es una "caja" de ahorro del usuario.
// Ejemplo: Lulo Bank, Bancolombia, Efectivo, etc.
type SavingsAccount struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Balance   float64   `json:"balance"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateSavingsAccountRequest — datos para crear una cuenta de ahorro.
type CreateSavingsAccountRequest struct {
	Name    string  `json:"name" binding:"required,min=1"`
	Balance float64 `json:"balance"`
	Color   string  `json:"color" binding:"required"`
	Icon    string  `json:"icon" binding:"required"`
	Notes   string  `json:"notes"`
}

// UpdateSavingsAccountRequest — datos para actualizar una cuenta de ahorro.
type UpdateSavingsAccountRequest struct {
	Name    string  `json:"name"`
	Balance float64 `json:"balance"`
	Color   string  `json:"color"`
	Icon    string  `json:"icon"`
	Notes   string  `json:"notes"`
}

// AdjustBalanceRequest — para agregar o quitar dinero de una cuenta.
type AdjustBalanceRequest struct {
	Amount float64 `json:"amount" binding:"required"`
	Type   string  `json:"type" binding:"required,oneof=deposit withdraw"`
}
