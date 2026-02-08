package services

import (
	"context"
	"log"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"
)

// Categorías predeterminadas (misma lista que en auth_service.go)
var defaultCats = []struct {
	Name  string
	Color string
	Icon  string
	Type  string
}{
	{"Taxi", "#f97316", "taxi", "expense"},
	{"Deportes", "#22c55e", "deportes", "expense"},
	{"Entretenimiento", "#8b5cf6", "entretenimiento", "expense"},
	{"Auto", "#3b82f6", "auto", "expense"},
	{"Comida", "#ef4444", "comida", "expense"},
	{"Casa", "#06b6d4", "casa", "expense"},
	{"Facturas", "#64748b", "facturas", "expense"},
	{"Higiene", "#ec4899", "higiene", "expense"},
	{"Restaurante", "#f59e0b", "restaurante", "expense"},
	{"Ropa", "#a855f7", "ropa", "expense"},
	{"Salud", "#10b981", "salud", "expense"},
	{"Transporte", "#0ea5e9", "transporte", "expense"},
	{"Regalos", "#f43f5e", "regalos", "expense"},
	{"Comunicaciones", "#6366f1", "comunicaciones", "expense"},
	{"Suscripciones", "#7c3aed", "suscripciones", "expense"},
	{"Mascotas", "#eab308", "mascotas", "expense"},
	{"Ocio", "#14b8a6", "ocio", "expense"},
	{"Maquillaje", "#f472b6", "maquillaje", "expense"},
	{"Skincare", "#a78bfa", "skincare", "expense"},
	{"Salario", "#22c55e", "salario", "income"},
	{"Depósito", "#0ea5e9", "deposito", "income"},
}

type CategoryService struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryService(categoryRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

// íconos de las categorías nuevas que queremos asegurar para todos (incluso usuarios existentes)
var newDefaultIcons = map[string]struct{ Name, Color string }{
	"mascotas":  {"Mascotas", "#eab308"},
	"ocio":      {"Ocio", "#14b8a6"},
	"maquillaje": {"Maquillaje", "#f472b6"},
	"skincare":  {"Skincare", "#a78bfa"},
}

func (s *CategoryService) GetAll(ctx context.Context, userID string) ([]models.Category, error) {
	categories, err := s.categoryRepo.GetAllByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Si el usuario no tiene categorías, crear todas las predeterminadas
	if len(categories) == 0 {
		log.Printf("Usuario %s sin categorías, creando predeterminadas...", userID)
		for _, cat := range defaultCats {
			created, err := s.categoryRepo.Create(ctx, userID, cat.Name, cat.Color, cat.Icon, cat.Type)
			if err != nil {
				log.Printf("Error creando categoría '%s': %v", cat.Name, err)
				continue
			}
			categories = append(categories, *created)
		}
	} else {
		// Usuario existente: asegurar que tenga las categorías nuevas (Mascotas, Ocio, Maquillaje, Skincare)
		hasIcon := make(map[string]bool)
		for _, c := range categories {
			hasIcon[c.Icon] = true
		}
		for icon, info := range newDefaultIcons {
			if !hasIcon[icon] {
				created, err := s.categoryRepo.Create(ctx, userID, info.Name, info.Color, icon, "expense")
				if err != nil {
					log.Printf("Error creando categoría '%s' para usuario existente: %v", info.Name, err)
					continue
				}
				categories = append(categories, *created)
				hasIcon[icon] = true
			}
		}
	}

	if categories == nil {
		categories = []models.Category{}
	}
	return categories, nil
}

func (s *CategoryService) GetByID(ctx context.Context, id, userID string) (*models.Category, error) {
	return s.categoryRepo.GetByID(ctx, id, userID)
}

func (s *CategoryService) Create(ctx context.Context, userID string, req models.CreateCategoryRequest) (*models.Category, error) {
	return s.categoryRepo.Create(ctx, userID, req.Name, req.Color, req.Icon, req.Type)
}

func (s *CategoryService) Update(ctx context.Context, id, userID string, req models.UpdateCategoryRequest) (*models.Category, error) {
	return s.categoryRepo.Update(ctx, id, userID, req.Name, req.Nickname, req.Color, req.Icon)
}

func (s *CategoryService) Delete(ctx context.Context, id, userID string) error {
	return s.categoryRepo.Delete(ctx, id, userID)
}
