-- ============================================
-- Migración 002: Tabla de categorías
-- Cada usuario tiene sus propias categorías (comida, transporte, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50) NOT NULL DEFAULT 'tag',
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para filtrar categorías por usuario
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
