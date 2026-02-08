// Página de registro — con validación inline, confirmar contraseña, y errores claros.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Wallet, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Validaciones de contraseña en tiempo real
  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones frontend
    if (!name.trim() || name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await register(email, password, name);
      toast.success("¡Cuenta creada! Ahora inicia sesión.");
      navigate("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 409) {
          setError(message || "Este email ya está registrado. ¿Quieres iniciar sesión?");
        } else if (status === 400) {
          setError(message || "Datos inválidos. Revisa los campos e intenta de nuevo.");
        } else if (!err.response) {
          setError("No se puede conectar al servidor. Intenta de nuevo en unos segundos.");
        } else {
          setError(message || "Error inesperado. Intenta de nuevo.");
        }
      } else {
        setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 dark:bg-white rounded-lg mb-3">
            <Wallet className="w-5 h-5 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Crear cuenta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Empieza a controlar tus finanzas
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4"
        >
          {/* Error message inline */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
                {error.includes("ya está registrado") && (
                  <Link
                    to="/login"
                    className="underline font-medium mt-1 inline-block"
                  >
                    Ir a iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              required
              minLength={2}
              autoComplete="name"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-shadow"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              autoComplete="email"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-shadow"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-shadow pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
              autoComplete="new-password"
              className={`w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow ${
                confirmPassword && !passwordChecks.match
                  ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                  : "border-gray-200 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-gray-300"
              }`}
              placeholder="Repite la contraseña"
            />
          </div>

          {/* Indicadores de validación en tiempo real */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${passwordChecks.length ? "text-green-500" : "text-gray-300 dark:text-gray-600"}`}
                />
                <span
                  className={`text-xs ${passwordChecks.length ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}
                >
                  Al menos 6 caracteres
                </span>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${passwordChecks.match ? "text-green-500" : "text-red-400"}`}
                  />
                  <span
                    className={`text-xs ${passwordChecks.match ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                  >
                    {passwordChecks.match
                      ? "Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (confirmPassword.length > 0 && !passwordChecks.match)}
            className="w-full py-2.5 px-4 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
