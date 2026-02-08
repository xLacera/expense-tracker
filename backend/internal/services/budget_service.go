package services

import (
	"context"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"
)

type BudgetService struct {
	budgetRepo *repository.BudgetRepository
}

func NewBudgetService(budgetRepo *repository.BudgetRepository) *BudgetService {
	return &BudgetService{budgetRepo: budgetRepo}
}

func (s *BudgetService) Upsert(ctx context.Context, userID string, req models.CreateBudgetRequest) (*models.Budget, error) {
	return s.budgetRepo.Upsert(ctx, userID, req)
}

func (s *BudgetService) GetByPeriod(ctx context.Context, userID string, month, year int) ([]models.Budget, error) {
	budgets, err := s.budgetRepo.GetByPeriod(ctx, userID, month, year)
	if err != nil {
		return nil, err
	}
	if budgets == nil {
		budgets = []models.Budget{}
	}
	return budgets, nil
}

func (s *BudgetService) Delete(ctx context.Context, id, userID string) error {
	return s.budgetRepo.Delete(ctx, id, userID)
}
