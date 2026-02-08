-- ============================================
-- Migración 007: Tabla para restablecer contraseña con OTP
-- Guarda códigos OTP de 6 dígitos con expiración de 10 minutos.
-- ============================================

CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar por user_id y otp_code rápidamente
CREATE INDEX IF NOT EXISTS idx_password_resets_user_otp ON password_resets(user_id, otp_code);

-- Limpiar OTPs expirados automáticamente no es estrictamente necesario
-- con pocos usuarios, pero el índice ayuda a que las queries sean rápidas.
