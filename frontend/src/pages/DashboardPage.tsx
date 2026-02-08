// Dashboard — estilo shadcn/ui SaaS.
// Cards con bordes sutiles, alta densidad de información.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { reportsAPI } from "../api/reports";
import { transactionsAPI } from "../api/transactions";
import { savingsAPI } from "../api/savings";
import { useAuthStore } from "../store/authStore";
import type { MonthlySummary, Transaction } from "../types";
import {
  formatCOP,
  formatDateShort,
  formatMonthYear,
  getCurrentPeriod,
} from "../utils/format";
import { getEmoji } from "../utils/emojis";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const includeSavingsInTotal = user?.include_savings_in_total !== false;

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [savingsTotal, setSavingsTotal] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const { month, year } = getCurrentPeriod();

  useEffect(() => {
    loadData();
  }, [includeSavingsInTotal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, transactionsData, savingsData] = await Promise.all([
        reportsAPI.getMonthly(month, year),
        transactionsAPI.getAll({ limit: 5 }),
        includeSavingsInTotal
          ? savingsAPI.getAll()
          : Promise.resolve({ total: 0 }),
      ]);
      setSummary(summaryData);
      setRecentTransactions(transactionsData.transactions);
      setSavingsTotal(savingsData?.total ?? 0);
    } catch {
      toast.error("Error cargando datos del panel");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 dark:bg-gray-800 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumen de {formatMonthYear(month, year)}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Ingresos
            </span>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-950/40 rounded-md flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
            {formatCOP(summary?.total_income || 0)}
          </p>
        </div>

        {/* Gastos */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Gastos
            </span>
            <div className="w-8 h-8 bg-red-50 dark:bg-red-950/40 rounded-md flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
            {formatCOP(summary?.total_expense || 0)}
          </p>
        </div>

        {/* Balance */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance
            </span>
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
              <Scale className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-semibold truncate ${
              (summary?.balance || 0) >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCOP(summary?.balance || 0)}
          </p>
        </div>

        {/* Tu dinero total (balance + ahorros si el usuario lo tiene activado) */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tu dinero total
            </span>
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-md flex items-center justify-center">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-semibold truncate ${
              (summary?.balance ?? 0) + savingsTotal >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCOP((summary?.balance ?? 0) + savingsTotal)}
          </p>
          {includeSavingsInTotal && savingsTotal > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Incluye ahorros
            </p>
          )}
        </div>
      </div>

      {/* Últimas transacciones */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Últimas transacciones
          </h3>
          <Link
            to="/transactions"
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            No hay transacciones aún. ¡Empieza registrando tu primer ingreso o
            gasto!
          </div>
        ) : (
          <div>
            {recentTransactions.map((t, index) => (
              <div
                key={t.id}
                className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  index < recentTransactions.length - 1
                    ? "border-b border-gray-100 dark:border-gray-800"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: (t.category_color || "#6366f1") + "15",
                    }}
                  >
                    {getEmoji(t.category_icon || "")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t.description || t.category_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t.category_name} · {formatDateShort(t.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    t.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCOP(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
