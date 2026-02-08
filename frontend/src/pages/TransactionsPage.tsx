// Página de transacciones — estilo shadcn/ui SaaS.
// Tabla limpia, filtros, modal, paginación.

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { transactionsAPI } from "../api/transactions";
import { categoriesAPI } from "../api/categories";
import type {
  Transaction,
  TransactionFilter,
  Category,
  CreateTransactionRequest,
} from "../types";
import {
  formatCOP,
  formatDate,
  formatMonthYear,
  getTodayBogota,
  getCurrentPeriod,
} from "../utils/format";
import { getEmoji } from "../utils/emojis";
import MoneyInput from "../components/MoneyInput";
import toast from "react-hot-toast";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { month: currentMonth, year: currentYear } = getCurrentPeriod();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<CreateTransactionRequest>({
    category_id: "",
    amount: 0,
    type: "expense",
    description: "",
    date: getTodayBogota(),
    currency: "COP",
  });

  const getMonthRange = useCallback(() => {
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { date_from: firstDay, date_to: lastDayStr };
  }, [month, year]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { date_from, date_to } = getMonthRange();
      const filter: TransactionFilter = {
        page,
        limit: 20,
        date_from,
        date_to,
        type: filterType || undefined,
        category_id: filterCategory || undefined,
      };
      const data = await transactionsAPI.getAll(filter);
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      toast.error("Error cargando transacciones");
    } finally {
      setLoading(false);
    }
  }, [page, month, year, filterType, filterCategory, getMonthRange]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    categoriesAPI
      .getAll()
      .then(setCategories)
      .catch(() => toast.error("Error cargando categorías"));
  }, []);

  const monthIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await transactionsAPI.update(editingId, form);
        toast.success("Transacción actualizada");
      } else {
        await transactionsAPI.create(form);
        toast.success("Transacción creada");
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadTransactions();
    } catch {
      toast.error("Error guardando transacción");
    }
  };

  const handleEdit = (t: Transaction) => {
    setForm({
      category_id: t.category_id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      date: t.date,
      currency: t.currency,
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta transacción?")) return;
    try {
      await transactionsAPI.delete(id);
      toast.success("Transacción eliminada");
      loadTransactions();
    } catch {
      toast.error("Error eliminando transacción");
    }
  };

  const handleExport = async () => {
    try {
      const { date_from, date_to } = getMonthRange();
      await transactionsAPI.exportCSV(date_from, date_to);
      toast.success("Archivo CSV descargado");
    } catch {
      toast.error("Error exportando CSV");
    }
  };

  const resetForm = () => {
    setForm({
      category_id: "",
      amount: 0,
      type: "expense",
      description: "",
      date: getTodayBogota(),
      currency: "COP",
    });
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
    setPage(1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
    setPage(1);
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} registros este mes
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva
          </button>
        </div>
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

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ingresos
          </p>
          <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 truncate">
            {formatCOP(monthIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Gastos
          </p>
          <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 truncate">
            {formatCOP(monthExpense)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Balance
          </p>
          <p
            className={`text-xs sm:text-sm font-semibold truncate ${monthIncome - monthExpense >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatCOP(monthIncome - monthExpense)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
        >
          <option value="">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {getEmoji(c.icon)} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Modal/Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? "Editar transacción" : "Nueva transacción"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, type: "expense", category_id: "" })
                  }
                  className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                    form.type === "expense"
                      ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, type: "income", category_id: "" })
                  }
                  className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                    form.type === "income"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  Ingreso
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Monto (COP)
                </label>
                <MoneyInput
                  value={form.amount}
                  onChange={(amount) => setForm({ ...form, amount })}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="0"
                />
              </div>

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
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getEmoji(c.icon)} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="Descripción opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  {editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Cargando...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No hay transacciones en {formatMonthYear(month, year)}
          </div>
        ) : (
          <div>
            {transactions.map((t, index) => (
              <div
                key={t.id}
                className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  index < transactions.length - 1
                    ? "border-b border-gray-100 dark:border-gray-800"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0"
                    style={{
                      backgroundColor: (t.category_color || "#6366f1") + "15",
                    }}
                  >
                    {getEmoji(t.category_icon || "")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t.description || t.category_nickname || t.category_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t.category_nickname || t.category_name} · {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <span className="text-xs text-gray-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
