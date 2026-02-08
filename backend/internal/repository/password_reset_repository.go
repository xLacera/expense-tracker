// Package repository — operaciones de base de datos para password_resets.
// Maneja la creación y verificación de códigos OTP para restablecer contraseña.
package repository

import (
	"context"
	"fmt"

	"expense-tracker-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PasswordResetRepository maneja las operaciones de DB para la tabla password_resets.
type PasswordResetRepository struct {
	pool *pgxpool.Pool
}

// NewPasswordResetRepository crea una nueva instancia del repository.
func NewPasswordResetRepository(pool *pgxpool.Pool) *PasswordResetRepository {
	return &PasswordResetRepository{pool: pool}
}

// Create inserta un nuevo registro de OTP en la base de datos.
func (r *PasswordResetRepository) Create(ctx context.Context, pr *models.PasswordReset) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO password_resets (user_id, otp_code, expires_at)
		 VALUES ($1, $2, $3)`,
		pr.UserID, pr.OTPCode, pr.ExpiresAt,
	)
	if err != nil {
		return fmt.Errorf("error creando password reset: %w", err)
	}
	return nil
}

// GetValidOTP busca un OTP válido (no usado, no expirado) para un usuario y código dado.
func (r *PasswordResetRepository) GetValidOTP(ctx context.Context, userID, otpCode string) (*models.PasswordReset, error) {
	pr := &models.PasswordReset{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, otp_code, expires_at, used, created_at
		 FROM password_resets
		 WHERE user_id = $1
		   AND otp_code = $2
		   AND used = FALSE
		   AND expires_at > NOW()
		 ORDER BY created_at DESC
		 LIMIT 1`,
		userID, otpCode,
	).Scan(&pr.ID, &pr.UserID, &pr.OTPCode, &pr.ExpiresAt, &pr.Used, &pr.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("OTP no válido o expirado: %w", err)
	}
	return pr, nil
}

// MarkUsed marca un OTP como usado para que no se pueda reutilizar.
func (r *PasswordResetRepository) MarkUsed(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE password_resets SET used = TRUE WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("error marcando OTP como usado: %w", err)
	}
	return nil
}

// InvalidateAllForUser marca todos los OTPs pendientes de un usuario como usados.
// Se llama antes de crear uno nuevo para que solo haya un OTP activo a la vez.
func (r *PasswordResetRepository) InvalidateAllForUser(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE password_resets SET used = TRUE
		 WHERE user_id = $1 AND used = FALSE`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("error invalidando OTPs anteriores: %w", err)
	}
	return nil
}
