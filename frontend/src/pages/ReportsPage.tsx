// Página de reportes — estilo shadcn/ui SaaS.
// Gráficas Recharts en cards con bordes sutiles.

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { reportsAPI } from "../api/reports";
import type { MonthlySummary, YearlySummary } from "../types";
import {
  formatCOP,
  formatMonthYear,
  getCurrentPeriod,
  MONTH_NAMES,
} from "../utils/format";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [yearly, setYearly] = useState<YearlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { month: currentMonth, year: currentYear } = getCurrentPeriod();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [monthlyData, yearlyData] = await Promise.all([
        reportsAPI.getMonthly(month, year),
        reportsAPI.getYearly(year),
      ]);
      setMonthly(monthlyData);
      setYearly(yearlyData);
    } catch {
      toast.error("Error cargando reportes");
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const expenseByCategory =
    monthly?.by_category.filter((c) => c.type === "expense") || [];
  const incomeByCategory =
    monthly?.by_category.filter((c) => c.type === "income") || [];

  const yearlyTrend =
    yearly?.monthly.map((m) => ({
      name: MONTH_NAMES[m.month - 1],
      Ingresos: m.total_income,
      Gastos: m.total_expense,
      Balance: m.balance,
    })) || [];

  const monthlyBar = [
    { name: "Ingresos", value: monthly?.total_income || 0, fill: "#22c55e" },
    { name: "Gastos", value: monthly?.total_expense || 0, fill: "#ef4444" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Subtítulo */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Visualiza tus finanzas
      </p>

      {/* Selector de mes */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prevMonth}
          className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize min-w-[140px] text-center">
          {formatMonthYear(month, year)}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ingresos
          </p>
          <p className="text-sm sm:text-lg font-semibold text-green-600 dark:text-green-400 truncate">
            {formatCOP(monthly?.total_income || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Gastos
          </p>
          <p className="text-sm sm:text-lg font-semibold text-red-600 dark:text-red-400 truncate">
            {formatCOP(monthly?.total_expense || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Balance
          </p>
          <p
            className={`text-sm sm:text-lg font-semibold truncate ${(monthly?.balance || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatCOP(monthly?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Gráfica: Ingresos vs Gastos (barras) */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Ingresos vs Gastos
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyBar}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value) => formatCOP(Number(value))} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {monthlyBar.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gastos por categoría */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Gastos por categoría
          </h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay gastos este mes
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={false}
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.category_color || "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCOP(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {expenseByCategory.map((c) => (
                  <div
                    key={c.category_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.category_color }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {c.category_name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCOP(c.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ingresos por categoría */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Ingresos por categoría
          </h3>
          {incomeByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay ingresos este mes
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={false}
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.category_color || "#22c55e"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCOP(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {incomeByCategory.map((c) => (
                  <div
                    key={c.category_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.category_color }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {c.category_name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCOP(c.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tendencia anual */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Tendencia anual {year}
        </h3>
        {yearlyTrend.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No hay datos para este año
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={yearlyTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(value) => formatCOP(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Ingresos"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Gastos"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Balance"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Resumen anual */}
        {yearly && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                Ingresos {year}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 mt-0.5 truncate">
                {formatCOP(yearly.total_income)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                Gastos {year}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 mt-0.5 truncate">
                {formatCOP(yearly.total_expense)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                Balance {year}
              </p>
              <p
                className={`text-xs sm:text-sm font-semibold mt-0.5 truncate ${yearly.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {formatCOP(yearly.balance)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
