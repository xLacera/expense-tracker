// Tipos TypeScript - Definen la forma de los datos en toda la app.
// Esto nos da autocompletado y detección de errores en tiempo de desarrollo.

export interface User {
  id: string;
  email: string;
  name: string;
  /** Si true, los ahorros se suman al "Tu dinero total" del dashboard. Por defecto true. */
  include_savings_in_total?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsResponse {
  include_savings_in_total: boolean;
}

export interface UpdateUserSettingsRequest {
  include_savings_in_total: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  nickname: string; // Alias personalizado (ej: "Mi carrito" para Auto)
  color: string;
  icon: string;
  type: "income" | "expense";
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  nickname?: string;
  color: string;
  icon: string;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_nickname?: string;
  category_color?: string;
  category_icon?: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  category_id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  currency?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TransactionFilter {
  type?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  amount_limit: number;
  spent: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetRequest {
  category_id: string;
  amount_limit: number;
  month: number;
  year: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_color: string;
  type: string;
  total: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: CategorySummary[];
}

export interface MonthlyTotals {
  month: number;
  total_income: number;
  total_expense: number;
  balance: number;
}

export interface YearlySummary {
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  monthly: MonthlyTotals[];
}

// --- Cuentas de ahorro ---

export interface SavingsAccount {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavingsAccountRequest {
  name: string;
  balance: number;
  color: string;
  icon: string;
  notes: string;
}

export interface UpdateSavingsAccountRequest {
  name?: string;
  balance?: number;
  color?: string;
  icon?: string;
  notes?: string;
}

export interface AdjustBalanceRequest {
  amount: number;
  type: "deposit" | "withdraw";
}

export interface SavingsListResponse {
  accounts: SavingsAccount[];
  total: number;
}
