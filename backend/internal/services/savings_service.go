// Service de cuentas de ahorro — lógica de negocio.
package services

import (
	"context"
	"errors"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"
)

type SavingsService struct {
	savingsRepo *repository.SavingsRepository
}

func NewSavingsService(savingsRepo *repository.SavingsRepository) *SavingsService {
	return &SavingsService{savingsRepo: savingsRepo}
}

// Create crea una nueva cuenta de ahorro.
func (s *SavingsService) Create(ctx context.Context, userID string, req models.CreateSavingsAccountRequest) (*models.SavingsAccount, error) {
	if req.Balance < 0 {
		return nil, errors.New("el balance inicial no puede ser negativo")
	}
	return s.savingsRepo.Create(ctx, userID, req.Name, req.Balance, req.Color, req.Icon, req.Notes)
}

// GetAll devuelve todas las cuentas de ahorro del usuario.
func (s *SavingsService) GetAll(ctx context.Context, userID string) ([]models.SavingsAccount, error) {
	accounts, err := s.savingsRepo.GetAllByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if accounts == nil {
		accounts = []models.SavingsAccount{}
	}
	return accounts, nil
}

// Update actualiza una cuenta de ahorro.
func (s *SavingsService) Update(ctx context.Context, id, userID string, req models.UpdateSavingsAccountRequest) (*models.SavingsAccount, error) {
	// Primero verificar que exista y sea del usuario
	existing, err := s.savingsRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	// Aplicar solo los campos que se enviaron
	name := existing.Name
	if req.Name != "" {
		name = req.Name
	}
	balance := existing.Balance
	if req.Balance != 0 || req.Balance == 0 {
		balance = req.Balance
	}
	color := existing.Color
	if req.Color != "" {
		color = req.Color
	}
	icon := existing.Icon
	if req.Icon != "" {
		icon = req.Icon
	}
	notes := req.Notes

	return s.savingsRepo.Update(ctx, id, userID, name, balance, color, icon, notes)
}

// AdjustBalance deposita o retira dinero de una cuenta.
func (s *SavingsService) AdjustBalance(ctx context.Context, id, userID string, req models.AdjustBalanceRequest) (*models.SavingsAccount, error) {
	if req.Amount <= 0 {
		return nil, errors.New("el monto debe ser mayor a 0")
	}

	// Verificar que exista
	existing, err := s.savingsRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	var adjustAmount float64
	if req.Type == "deposit" {
		adjustAmount = req.Amount
	} else {
		// withdraw
		if existing.Balance < req.Amount {
			return nil, errors.New("fondos insuficientes en esta cuenta")
		}
		adjustAmount = -req.Amount
	}

	return s.savingsRepo.AdjustBalance(ctx, id, userID, adjustAmount)
}

// Delete elimina una cuenta de ahorro.
func (s *SavingsService) Delete(ctx context.Context, id, userID string) error {
	return s.savingsRepo.Delete(ctx, id, userID)
}

// GetTotal devuelve el total ahorrado del usuario.
func (s *SavingsService) GetTotal(ctx context.Context, userID string) (float64, error) {
	return s.savingsRepo.GetTotalByUser(ctx, userID)
}
