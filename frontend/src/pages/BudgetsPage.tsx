// Página de presupuestos — estilo shadcn/ui SaaS.

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { budgetsAPI } from "../api/budgets";
import { categoriesAPI } from "../api/categories";
import type { Budget, Category, CreateBudgetRequest } from "../types";
import { formatCOP, formatMonthYear, getCurrentPeriod } from "../utils/format";
import { getEmoji } from "../utils/emojis";
import MoneyInput from "../components/MoneyInput";
import toast from "react-hot-toast";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { month: currentMonth, year: currentYear } = getCurrentPeriod();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [form, setForm] = useState<CreateBudgetRequest>({
    category_id: "",
    amount_limit: 0,
    month: currentMonth,
    year: currentYear,
  });

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, categoriesData] = await Promise.all([
        budgetsAPI.getByPeriod(month, year),
        categoriesAPI.getAll(),
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData.filter((c) => c.type === "expense"));
    } catch {
      toast.error("Error cargando presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await budgetsAPI.create({ ...form, month, year });
      toast.success("Presupuesto guardado");
      setShowForm(false);
      setForm({ category_id: "", amount_limit: 0, month, year });
      loadData();
    } catch {
      toast.error("Error guardando presupuesto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    try {
      await budgetsAPI.delete(id);
      toast.success("Presupuesto eliminado");
      loadData();
    } catch {
      toast.error("Error eliminando presupuesto");
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Controla tu gasto mensual por categoría
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

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

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg p-5 sm:p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Nuevo presupuesto — {formatMonthYear(month, year)}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Límite (COP)
                </label>
                <MoneyInput
                  value={form.amount_limit}
                  onChange={(amount_limit) =>
                    setForm({ ...form, amount_limit })
                  }
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="500.000"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de presupuestos */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">
          Cargando...
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No hay presupuestos para este mes. ¡Crea uno para empezar a controlar
          tus gastos!
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map((b) => {
            const percentage =
              b.amount_limit > 0 ? (b.spent / b.amount_limit) * 100 : 0;
            const isOver = percentage > 100;
            const isWarning = percentage > 80 && percentage <= 100;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: (b.category_color || "#6366f1") + "15",
                      }}
                    >
                      {getEmoji(b.category_icon || "")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {b.category_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatCOP(b.spent)} de {formatCOP(b.amount_limit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                        <AlertTriangle className="w-3 h-3" /> Excedido
                      </span>
                    )}
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 rounded-md border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="w-3 h-3" /> Cuidado
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver
                        ? "bg-red-500"
                        : isWarning
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right">
                  {percentage.toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
