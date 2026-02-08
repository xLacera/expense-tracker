// Utilidades de formato para la app.
// Centralizamos los formatos aquí para que toda la app muestre datos igual.

// Formatea un número como moneda colombiana: $1.234.567
// En Colombia se usa el punto como separador de miles y la coma para decimales.
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formato latinoamericano: día / mes / año (ej. 7 feb. 2026)
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00"); // Evitar problemas de timezone
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

// Formato corto numérico latinoamericano: DD/MM/YYYY (ej. 07/02/2026)
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

// Formatea una fecha como "Febrero 2026" (para encabezados de reportes)
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1); // month es 1-based, Date espera 0-based
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

// Nombres de meses en español (para gráficas)
export const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// Obtiene la fecha de hoy en formato YYYY-MM-DD (hora de Bogotá)
export function getTodayBogota(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

// Obtiene mes y año actuales en Bogotá
export function getCurrentPeriod(): { month: number; year: number } {
  const now = new Date();
  const bogota = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Bogota" }),
  );
  return {
    month: bogota.getMonth() + 1, // getMonth() es 0-based
    year: bogota.getFullYear(),
  };
}
