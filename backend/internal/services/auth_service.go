// Package services contiene la lógica de negocio.
// Los services validan datos, aplican reglas, y coordinan entre repositories.
// NO manejan HTTP ni SQL directamente.
package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	"time"

	"expense-tracker-backend/internal/email"
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
	{"Mascotas", "#eab308", "mascotas", "expense"},
	{"Ocio", "#14b8a6", "ocio", "expense"},
	{"Maquillaje", "#f472b6", "maquillaje", "expense"},
	{"Skincare", "#a78bfa", "skincare", "expense"},
	// Ingresos
	{"Salario", "#22c55e", "salario", "income"},
	{"Depósito", "#0ea5e9", "deposito", "income"},
}

// AuthService contiene la lógica de autenticación: registro, login, generación de JWT,
// y restablecimiento de contraseña con OTP.
type AuthService struct {
	userRepo          *repository.UserRepository
	categoryRepo      *repository.CategoryRepository
	passwordResetRepo *repository.PasswordResetRepository
	emailService      *email.ResendService
	jwtSecret         string
}

// NewAuthService crea una nueva instancia del servicio de autenticación.
// emailService puede ser nil si RESEND_API_KEY no está configurada (desarrollo local).
func NewAuthService(
	userRepo *repository.UserRepository,
	categoryRepo *repository.CategoryRepository,
	passwordResetRepo *repository.PasswordResetRepository,
	emailService *email.ResendService,
	jwtSecret string,
) *AuthService {
	return &AuthService{
		userRepo:          userRepo,
		categoryRepo:      categoryRepo,
		passwordResetRepo: passwordResetRepo,
		emailService:      emailService,
		jwtSecret:         jwtSecret,
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

// Errores específicos de autenticación para que el frontend pueda diferenciar.
var (
	ErrEmailNotFound    = errors.New("No hay una cuenta registrada con este correo")
	ErrWrongPassword    = errors.New("Contraseña incorrecta. Verifica e intenta de nuevo")
)

// Login verifica las credenciales y devuelve un token JWT.
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	// Buscar usuario por email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrEmailNotFound
	}

	// Comparar el password ingresado con el hash guardado
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, ErrWrongPassword
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

// ForgotPassword genera un OTP de 6 dígitos y lo envía por email.
// Si el email no existe, no devuelve error (por seguridad, para no revelar qué emails están registrados).
func (s *AuthService) ForgotPassword(ctx context.Context, req models.ForgotPasswordRequest) error {
	// Buscar usuario
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		// No revelamos si el email existe o no — solo decimos "si el email existe, recibirás un código"
		log.Printf("ForgotPassword: email %s no encontrado, ignorando silenciosamente", req.Email)
		return nil
	}

	// Verificar que el servicio de email está configurado
	if s.emailService == nil {
		return errors.New("el servicio de email no está configurado. Contacta al administrador")
	}

	// Invalidar OTPs anteriores de este usuario
	_ = s.passwordResetRepo.InvalidateAllForUser(ctx, user.ID)

	// Generar código OTP de 6 dígitos (criptográficamente seguro)
	otpCode, err := generateOTP()
	if err != nil {
		return fmt.Errorf("error generando OTP: %w", err)
	}

	// Guardar OTP en la base de datos con expiración de 10 minutos
	pr := &models.PasswordReset{
		UserID:    user.ID,
		OTPCode:   otpCode,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := s.passwordResetRepo.Create(ctx, pr); err != nil {
		return fmt.Errorf("error guardando OTP: %w", err)
	}

	// Enviar email con el código OTP
	if err := s.emailService.SendOTP(req.Email, otpCode); err != nil {
		return fmt.Errorf("error enviando email: %w", err)
	}

	log.Printf("OTP enviado exitosamente a %s", req.Email)
	return nil
}

// ResetPassword verifica el OTP y actualiza la contraseña del usuario.
func (s *AuthService) ResetPassword(ctx context.Context, req models.ResetPasswordRequest) error {
	// Buscar usuario por email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return errors.New("no se encontró una cuenta con ese correo")
	}

	// Verificar que el OTP sea válido y no esté expirado
	pr, err := s.passwordResetRepo.GetValidOTP(ctx, user.ID, req.OTP)
	if err != nil {
		return errors.New("código OTP inválido o expirado. Solicita uno nuevo")
	}

	// Hashear la nueva contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 10)
	if err != nil {
		return fmt.Errorf("error hasheando nueva contraseña: %w", err)
	}

	// Actualizar contraseña del usuario
	if err := s.userRepo.UpdatePassword(ctx, user.ID, string(hashedPassword)); err != nil {
		return fmt.Errorf("error actualizando contraseña: %w", err)
	}

	// Marcar OTP como usado
	_ = s.passwordResetRepo.MarkUsed(ctx, pr.ID)

	log.Printf("Contraseña restablecida exitosamente para %s", req.Email)
	return nil
}

// generateOTP genera un código numérico de 6 dígitos criptográficamente seguro.
func generateOTP() (string, error) {
	// crypto/rand genera números aleatorios seguros (no predecibles)
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	// Formatear con ceros a la izquierda para siempre tener 6 dígitos
	return fmt.Sprintf("%06d", n.Int64()), nil
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
