package services

import (
	"context"
	"fmt"
	"math"
	"strings"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"
)

type TransactionService struct {
	transactionRepo *repository.TransactionRepository
}

func NewTransactionService(transactionRepo *repository.TransactionRepository) *TransactionService {
	return &TransactionService{transactionRepo: transactionRepo}
}

// GetFiltered devuelve transacciones paginadas y filtradas.
func (s *TransactionService) GetFiltered(ctx context.Context, filter models.TransactionFilter) (*models.TransactionListResponse, error) {
	// Validar y ajustar paginación
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}

	transactions, total, err := s.transactionRepo.GetFiltered(ctx, filter)
	if err != nil {
		return nil, err
	}

	if transactions == nil {
		transactions = []models.Transaction{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return &models.TransactionListResponse{
		Transactions: transactions,
		Total:        total,
		Page:         filter.Page,
		Limit:        filter.Limit,
		TotalPages:   totalPages,
	}, nil
}

// Create crea una nueva transacción.
func (s *TransactionService) Create(ctx context.Context, userID string, req models.CreateTransactionRequest) (*models.Transaction, error) {
	return s.transactionRepo.Create(ctx, userID, req)
}

// Update actualiza una transacción existente.
func (s *TransactionService) Update(ctx context.Context, id, userID string, req models.UpdateTransactionRequest) (*models.Transaction, error) {
	return s.transactionRepo.Update(ctx, id, userID, req)
}

// Delete elimina una transacción.
func (s *TransactionService) Delete(ctx context.Context, id, userID string) error {
	return s.transactionRepo.Delete(ctx, id, userID)
}

// ExportCSV genera el contenido CSV de todas las transacciones del usuario.
func (s *TransactionService) ExportCSV(ctx context.Context, userID string, filter models.TransactionFilter) (string, error) {
	transactions, err := s.transactionRepo.GetAllForExport(ctx, userID, filter)
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	// Encabezados del CSV
	sb.WriteString("Fecha,Tipo,Categoría,Descripción,Monto,Moneda\n")

	for _, t := range transactions {
		tipo := "Gasto"
		if t.Type == "income" {
			tipo = "Ingreso"
		}
		// Escapar comillas en la descripción
		desc := strings.ReplaceAll(t.Description, "\"", "\"\"")
		line := fmt.Sprintf("%s,%s,%s,\"%s\",%.2f,%s\n",
			t.DateStr, tipo, t.CategoryName, desc, t.Amount, t.Currency)
		sb.WriteString(line)
	}

	return sb.String(), nil
}
