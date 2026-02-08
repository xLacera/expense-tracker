// Mapa de emojis para categorías.
// El campo "icon" en la DB guarda la clave (ej: "comida"),
// y aquí la traducimos al emoji correspondiente.

export const CATEGORY_EMOJIS: Record<string, string> = {
  // Gastos
  taxi: "🚕",
  deportes: "⚽",
  entretenimiento: "🎬",
  auto: "🚗",
  comida: "🍔",
  casa: "🏠",
  facturas: "📄",
  higiene: "🧴",
  restaurante: "🍽️",
  ropa: "👕",
  salud: "💊",
  transporte: "🚌",
  regalos: "🎁",
  comunicaciones: "📱",
  suscripciones: "📺",
  // Ingresos
  salario: "💰",
  deposito: "🏦",
  // Ahorros / Bancos
  piggybank: "🐷",
  banco: "🏦",
  caja: "💼",
  monedas: "🪙",
  billete: "💵",
  seguro: "🔒",
  estrella: "⭐",
  diamante: "💎",
  cohete: "🚀",
  meta: "🎯",
  // Otros
  otros: "📌",
  tag: "🏷️",
};

// Obtiene el emoji de una categoría. Si no existe, devuelve un emoji por defecto.
export function getEmoji(icon: string): string {
  return CATEGORY_EMOJIS[icon] || "📌";
}

// Lista de emojis de gasto para el selector
export const EXPENSE_EMOJI_OPTIONS = [
  { key: "comida", emoji: "🍔", label: "Comida" },
  { key: "restaurante", emoji: "🍽️", label: "Restaurante" },
  { key: "transporte", emoji: "🚌", label: "Transporte" },
  { key: "taxi", emoji: "🚕", label: "Taxi" },
  { key: "auto", emoji: "🚗", label: "Auto" },
  { key: "casa", emoji: "🏠", label: "Casa" },
  { key: "facturas", emoji: "📄", label: "Facturas" },
  { key: "salud", emoji: "💊", label: "Salud" },
  { key: "ropa", emoji: "👕", label: "Ropa" },
  { key: "deportes", emoji: "⚽", label: "Deportes" },
  { key: "entretenimiento", emoji: "🎬", label: "Entretenimiento" },
  { key: "higiene", emoji: "🧴", label: "Higiene" },
  { key: "regalos", emoji: "🎁", label: "Regalos" },
  { key: "comunicaciones", emoji: "📱", label: "Comunicaciones" },
  { key: "suscripciones", emoji: "📺", label: "Suscripciones" },
  { key: "otros", emoji: "📌", label: "Otros" },
];

// Lista de emojis de ingreso para el selector
export const INCOME_EMOJI_OPTIONS = [
  { key: "salario", emoji: "💰", label: "Salario" },
  { key: "deposito", emoji: "🏦", label: "Depósito" },
  { key: "otros", emoji: "📌", label: "Otros" },
];

// Lista de emojis para cuentas de ahorro
export const SAVINGS_EMOJI_OPTIONS = [
  { key: "banco", emoji: "🏦", label: "Banco" },
  { key: "piggybank", emoji: "🐷", label: "Alcancía" },
  { key: "billete", emoji: "💵", label: "Efectivo" },
  { key: "monedas", emoji: "🪙", label: "Monedas" },
  { key: "caja", emoji: "💼", label: "Caja fuerte" },
  { key: "seguro", emoji: "🔒", label: "Seguro" },
  { key: "estrella", emoji: "⭐", label: "Estrella" },
  { key: "diamante", emoji: "💎", label: "Diamante" },
  { key: "cohete", emoji: "🚀", label: "Cohete" },
  { key: "meta", emoji: "🎯", label: "Meta" },
];
