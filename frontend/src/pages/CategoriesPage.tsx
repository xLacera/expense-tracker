// Página de categorías — estilo shadcn/ui SaaS.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoriesAPI } from "../api/categories";
import type { Category, CreateCategoryRequest } from "../types";
import {
  getEmoji,
  EXPENSE_EMOJI_OPTIONS,
  INCOME_EMOJI_OPTIONS,
} from "../utils/emojis";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCategoryRequest>({
    name: "",
    color: "#6366f1",
    icon: "comida",
    type: "expense",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch {
      toast.error("Error cargando categorías");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoriesAPI.update(editingId, {
          name: form.name,
          color: form.color,
          icon: form.icon,
        });
        toast.success("Categoría actualizada");
      } else {
        await categoriesAPI.create(form);
        toast.success("Categoría creada");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", color: "#6366f1", icon: "comida", type: "expense" });
      loadCategories();
    } catch {
      toast.error("Error guardando categoría");
    }
  };

  const handleEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type,
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Eliminar esta categoría? Las transacciones asociadas no se pueden eliminar si tienen esta categoría.",
      )
    )
      return;
    try {
      await categoriesAPI.delete(id);
      toast.success("Categoría eliminada");
      loadCategories();
    } catch {
      toast.error("No se puede eliminar: tiene transacciones asociadas");
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const emojiOptions =
    form.type === "expense" ? EXPENSE_EMOJI_OPTIONS : INCOME_EMOJI_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organiza tus ingresos y gastos
        </p>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({
              name: "",
              color: "#6366f1",
              icon: "comida",
              type: "expense",
            });
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg p-5 sm:p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? "Editar categoría" : "Nueva categoría"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, type: "expense", icon: "comida" })
                    }
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      form.type === "expense"
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                        : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, type: "income", icon: "salario" })
                    }
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      form.type === "income"
                        ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="Ej: Comida, Transporte..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-7 h-7 rounded-md transition-all ${
                        form.color === color
                          ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-300 dark:ring-offset-gray-900"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ícono
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm({ ...form, icon: opt.key })}
                      className={`w-9 h-9 text-lg rounded-md flex items-center justify-center transition-colors ${
                        form.icon === opt.key
                          ? "bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-900 dark:ring-gray-300"
                          : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
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

      {/* Lista de categorías */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">
          Cargando...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Gastos ({expenseCategories.length})
            </h3>
            <div className="space-y-1.5">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: cat.color + "15" }}
                    >
                      {getEmoji(cat.icon)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay categorías de gastos
                </p>
              )}
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Ingresos ({incomeCategories.length})
            </h3>
            <div className="space-y-1.5">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: cat.color + "15" }}
                    >
                      {getEmoji(cat.icon)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay categorías de ingresos
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
