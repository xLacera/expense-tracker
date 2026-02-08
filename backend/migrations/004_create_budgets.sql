-- ============================================
-- Migración 004: Tabla de presupuestos mensuales
-- Permite definir un límite de gasto por categoría por mes
-- ============================================

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount_limit DECIMAL(15, 2) NOT NULL CHECK (amount_limit > 0),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Un usuario solo puede tener un presupuesto por categoría por mes
    UNIQUE(user_id, category_id, month, year)
);

-- Índice para consultar presupuestos por usuario y periodo
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, month, year);
