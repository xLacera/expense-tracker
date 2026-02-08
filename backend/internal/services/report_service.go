package services

import (
	"context"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"
)

type ReportService struct {
	reportRepo *repository.ReportRepository
}

func NewReportService(reportRepo *repository.ReportRepository) *ReportService {
	return &ReportService{reportRepo: reportRepo}
}

func (s *ReportService) GetMonthlySummary(ctx context.Context, userID string, month, year int) (*models.MonthlySummary, error) {
	return s.reportRepo.GetMonthlySummary(ctx, userID, month, year)
}

func (s *ReportService) GetYearlySummary(ctx context.Context, userID string, year int) (*models.YearlySummary, error) {
	return s.reportRepo.GetYearlySummary(ctx, userID, year)
}
