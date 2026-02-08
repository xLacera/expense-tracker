package models

import "time"

// Transaction representa un ingreso o gasto registrado por el usuario.
type Transaction struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	CategoryID    string    `json:"category_id"`
	CategoryName     string    `json:"category_name,omitempty"`
	CategoryNickname string    `json:"category_nickname,omitempty"`
	CategoryColor    string    `json:"category_color,omitempty"`
	CategoryIcon     string    `json:"category_icon,omitempty"`
	Amount        float64   `json:"amount"`
	Type          string    `json:"type"`
	Description   string    `json:"description"`
	Date          time.Time `json:"-"`        // No se serializa directamente
	DateStr       string    `json:"date"`     // Se llena manualmente como "2006-01-02"
	Currency      string    `json:"currency"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// FormatDate convierte Date (time.Time) a DateStr (string "2006-01-02")
func (t *Transaction) FormatDate() {
	t.DateStr = t.Date.Format("2006-01-02")
}

// CreateTransactionRequest es lo que el frontend envía para crear una transacción.
type CreateTransactionRequest struct {
	CategoryID  string  `json:"category_id" binding:"required,uuid"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Type        string  `json:"type" binding:"required,oneof=income expense"`
	Description string  `json:"description" binding:"max=255"`
	Date        string  `json:"date" binding:"required"` // "2006-01-02"
	Currency    string  `json:"currency" binding:"omitempty,len=3"`
}

// UpdateTransactionRequest permite actualizar campos de una transacción.
type UpdateTransactionRequest struct {
	CategoryID  string  `json:"category_id" binding:"omitempty,uuid"`
	Amount      float64 `json:"amount" binding:"omitempty,gt=0"`
	Type        string  `json:"type" binding:"omitempty,oneof=income expense"`
	Description string  `json:"description" binding:"omitempty,max=255"`
	Date        string  `json:"date" binding:"omitempty"`
	Currency    string  `json:"currency" binding:"omitempty,len=3"`
}

// TransactionFilter contiene los filtros para listar transacciones.
type TransactionFilter struct {
	UserID     string
	Type       string
	CategoryID string
	DateFrom   string // "2006-01-02"
	DateTo     string // "2006-01-02"
	Page       int
	Limit      int
}

// TransactionListResponse incluye las transacciones y metadata de paginación.
type TransactionListResponse struct {
	Transactions []Transaction `json:"transactions"`
	Total        int           `json:"total"`
	Page         int           `json:"page"`
	Limit        int           `json:"limit"`
	TotalPages   int           `json:"total_pages"`
}
