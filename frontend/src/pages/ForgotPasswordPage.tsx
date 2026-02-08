// Página de restablecer contraseña — flujo de 2 pasos:
// Paso 1: Ingresar email → recibir OTP por correo
// Paso 2: Ingresar OTP de 6 dígitos + nueva contraseña

import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2, Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { authAPI } from "../api/auth";

export default function ForgotPasswordPage() {
  // Paso actual: 1 = email, 2 = OTP + nueva contraseña
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Refs para los 6 inputs de OTP (para auto-focus)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Validaciones de contraseña en tiempo real
  const passwordChecks = {
    length: newPassword.length >= 6,
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  // --- Paso 1: Enviar email ---
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success("Si el correo existe, recibirás un código");
      setStep(2);
      // Focus en el primer input OTP
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        if (!err.response) {
          setError("No se puede conectar al servidor. Intenta de nuevo.");
        } else {
          setError(message || "Error enviando el código. Intenta de nuevo.");
        }
      } else {
        setError("Error de conexión. Verifica tu internet.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Manejo de inputs OTP ---
  const handleOtpChange = (index: number, value: string) => {
    // Solo permitir dígitos
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Retroceder al input anterior con Backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  // --- Paso 2: Verificar OTP y cambiar contraseña ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(email, otpCode, newPassword);
      toast.success("¡Contraseña actualizada! Ya puedes iniciar sesión");
      navigate("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        if (!err.response) {
          setError("No se puede conectar al servidor. Intenta de nuevo.");
        } else {
          setError(message || "Error restableciendo contraseña. Intenta de nuevo.");
        }
      } else {
        setError("Error de conexión. Verifica tu internet.");
      }
    } finally {
      setIsLoading(false);
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
            Restablecer contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 1
              ? "Te enviaremos un código a tu correo"
              : "Ingresa el código y tu nueva contraseña"}
          </p>
        </div>

        {/* Indicador de paso */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 1 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </div>
          <div className="w-8 h-px bg-gray-300 dark:bg-gray-700" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 2 ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
            <KeyRound className="w-3.5 h-3.5" />
            <span>Código + Contraseña</span>
          </div>
        </div>

        {/* === PASO 1: Email === */}
        {step === 1 && (
          <form
            onSubmit={handleSendOTP}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4"
          >
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-shadow"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Enviando código..." : "Enviar código"}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a iniciar sesión
            </Link>
          </form>
        )}

        {/* === PASO 2: OTP + Nueva contraseña === */}
        {step === 2 && (
          <form
            onSubmit={handleResetPassword}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4"
          >
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Código enviado a */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Código enviado a
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {email}
              </p>
            </div>

            {/* Inputs de OTP - 6 dígitos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                Código de verificación
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 text-center text-lg font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-shadow"
                  />
                ))}
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Indicadores de validación */}
            {newPassword.length > 0 && (
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
                      {passwordChecks.match ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
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
              {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>

            {/* Reenviar código */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline"
              >
                ¿No recibiste el código? Reenviar
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
