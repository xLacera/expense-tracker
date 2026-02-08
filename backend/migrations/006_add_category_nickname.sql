-- ============================================
-- Migración 006: Agregar alias/nombre personalizado a categorías
-- Permite ponerle un nombre custom a cada categoría.
-- Ejemplo: categoría "Auto" → nickname "Mi carrito"
-- ============================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) NOT NULL DEFAULT '';
