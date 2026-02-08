// Package services contiene la lógica de negocio.
// Los services validan datos, aplican reglas, y coordinan entre repositories.
// NO manejan HTTP ni SQL directamente.
package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Categorías predeterminadas que se crean para cada usuario nuevo.
// Cada una tiene: nombre, color hex, ícono (clave de emoji), tipo.
var defaultCategories = []struct {
	Name  string
	Color string
	Icon  string
	Type  string
}{
	// Gastos
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
	// Ingresos
	{"Salario", "#22c55e", "salario", "income"},
	{"Depósito", "#0ea5e9", "deposito", "income"},
}

// AuthService contiene la lógica de autenticación: registro, login, generación de JWT.
type AuthService struct {
	userRepo     *repository.UserRepository
	categoryRepo *repository.CategoryRepository
	jwtSecret    string
}

// NewAuthService crea una nueva instancia del servicio de autenticación.
func NewAuthService(userRepo *repository.UserRepository, categoryRepo *repository.CategoryRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		categoryRepo: categoryRepo,
		jwtSecret:    jwtSecret,
	}
}

// Register crea un nuevo usuario. Hashea el password antes de guardarlo.
// También crea las categorías predeterminadas para el usuario.
func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	// Verificar si el email ya existe
	existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("el email ya está registrado")
	}

	// Hashear el password con bcrypt (costo 10 = buen balance entre seguridad y velocidad)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, fmt.Errorf("error hasheando password: %w", err)
	}

	// Crear usuario en la base de datos
	user, err := s.userRepo.Create(ctx, req.Email, string(hashedPassword), req.Name)
	if err != nil {
		return nil, err
	}

	// Crear categorías predeterminadas para el usuario nuevo
	for _, cat := range defaultCategories {
		_, err := s.categoryRepo.Create(ctx, user.ID, cat.Name, cat.Color, cat.Icon, cat.Type)
		if err != nil {
			log.Printf("Error creando categoría predeterminada '%s': %v", cat.Name, err)
			// No fallar el registro por esto, solo log
		}
	}

	// Generar token JWT para que el usuario quede logueado inmediatamente
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// Login verifica las credenciales y devuelve un token JWT.
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	// Buscar usuario por email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// Comparar el password ingresado con el hash guardado
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// Generar token JWT
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// generateToken crea un JWT con el user_id como claim.
// El token expira en 72 horas (3 días).
func (s *AuthService) generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(72 * time.Hour).Unix(), // Expira en 3 días
		"iat":     time.Now().Unix(),                      // Fecha de creación
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", fmt.Errorf("error generando JWT: %w", err)
	}

	return tokenString, nil
}
