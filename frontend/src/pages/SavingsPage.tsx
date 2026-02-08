// Página de Ahorros — cuentas de ahorro separadas del flujo mensual.
// Cada cuenta tiene nombre, balance, color e ícono.
// Se puede depositar o retirar dinero de cada cuenta.

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
} from "lucide-react";
import { savingsAPI } from "../api/savings";
import type {
  SavingsAccount,
  CreateSavingsAccountRequest,
} from "../types";
import { formatCOP } from "../utils/format";
import { getEmoji, SAVINGS_EMOJI_OPTIONS } from "../utils/emojis";
import MoneyInput from "../components/MoneyInput";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

export default function SavingsPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"deposit" | "withdraw">("deposit");
  const [adjustAmount, setAdjustAmount] = useState(0);

  const [form, setForm] = useState<CreateSavingsAccountRequest>({
    name: "",
    balance: 0,
    color: "#6366f1",
    icon: "banco",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await savingsAPI.getAll();
      setAccounts(data.accounts);
      setTotal(data.total);
    } catch {
      toast.error("Error cargando ahorros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await savingsAPI.update(editingId, {
          name: form.name,
          balance: form.balance,
          color: form.color,
          icon: form.icon,
          notes: form.notes,
        });
        toast.success("Cuenta actualizada");
      } else {
        await savingsAPI.create(form);
        toast.success("Cuenta de ahorro creada");
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch {
      toast.error("Error guardando cuenta");
    }
  };

  const handleEdit = (acc: SavingsAccount) => {
    setForm({
      name: acc.name,
      balance: acc.balance,
      color: acc.color,
      icon: acc.icon,
      notes: acc.notes,
    });
    setEditingId(acc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta de ahorro?")) return;
    try {
      await savingsAPI.delete(id);
      toast.success("Cuenta eliminada");
      loadData();
    } catch {
      toast.error("Error eliminando cuenta");
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust || adjustAmount <= 0) return;
    try {
      await savingsAPI.adjustBalance(showAdjust, {
        amount: adjustAmount,
        type: adjustType,
      });
      toast.success(adjustType === "deposit" ? "Depósito realizado" : "Retiro realizado");
      setShowAdjust(null);
      setAdjustAmount(0);
      loadData();
    } catch {
      toast.error("Error al ajustar balance");
    }
  };

  const resetForm = () => {
    setForm({ name: "", balance: 0, color: "#6366f1", icon: "banco", notes: "" });
  };

  const adjustAccount = accounts.find((a) => a.id === showAdjust);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu dinero guardado, separado del gasto mensual
        </p>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva cuenta
        </button>
      </div>

      {/* Total de ahorros */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total ahorrado
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCOP(total)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"} de ahorro
        </p>
      </div>

      {/* Modal crear/editar cuenta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg p-5 sm:p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? "Editar cuenta" : "Nueva cuenta de ahorro"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Ej: Lulo Bank, Bancolombia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Balance actual (COP)
                </label>
                <MoneyInput
                  value={form.balance}
                  onChange={(balance) => setForm({ ...form, balance })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="Ej: Cuenta de nómina, CDT..."
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
                  {SAVINGS_EMOJI_OPTIONS.map((opt) => (
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

      {/* Modal depositar/retirar */}
      {showAdjust && adjustAccount && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg p-5 sm:p-6 w-full sm:max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: adjustAccount.color + "15" }}
              >
                {getEmoji(adjustAccount.icon)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {adjustAccount.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {formatCOP(adjustAccount.balance)}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdjust} className="space-y-4">
              {/* Tipo de operación */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("deposit")}
                  className={`py-2.5 text-sm font-medium rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                    adjustType === "deposit"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Depositar
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("withdraw")}
                  className={`py-2.5 text-sm font-medium rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                    adjustType === "withdraw"
                      ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Retirar
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Monto (COP)
                </label>
                <MoneyInput
                  value={adjustAmount}
                  onChange={setAdjustAmount}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {adjustType === "withdraw" && adjustAmount > adjustAccount.balance && (
                <p className="text-xs text-red-500">
                  No tienes suficiente balance para este retiro
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjust(null);
                    setAdjustAmount(0);
                  }}
                  className="flex-1 py-2 px-4 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjustAmount <= 0 || (adjustType === "withdraw" && adjustAmount > adjustAccount.balance)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                    adjustType === "deposit"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {adjustType === "deposit" ? "Depositar" : "Retirar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de cuentas */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">Cargando...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <PiggyBank className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tienes cuentas de ahorro. ¡Crea una para empezar!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: acc.color + "15" }}
                  >
                    {getEmoji(acc.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {acc.name}
                    </p>
                    {acc.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {acc.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCOP(acc.balance)}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setShowAdjust(acc.id);
                    setAdjustType("deposit");
                    setAdjustAmount(0);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-md hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Depositar
                </button>
                <button
                  onClick={() => {
                    setShowAdjust(acc.id);
                    setAdjustType("withdraw");
                    setAdjustAmount(0);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" /> Retirar
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleEdit(acc)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
