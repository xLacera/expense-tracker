-- ============================================
-- Migración 008: Preferencia para incluir ahorros en el dinero total
-- Si es true, el dashboard (y resumen general) muestra balance + ahorros.
-- Si es false, los ahorros se mantienen solo en la sección Ahorros.
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS include_savings_in_total BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN users.include_savings_in_total IS 'Si true, el total de ahorros se suma al dinero mostrado en el resumen general (dashboard).';
