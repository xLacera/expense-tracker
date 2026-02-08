// App.tsx - Punto de entrada de la app React.
// Aquí definimos TODAS las rutas y conectamos los componentes.

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useThemeStore } from "./store/themeStore";

// Páginas
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import BudgetsPage from "./pages/BudgetsPage";
import ReportsPage from "./pages/ReportsPage";
import SavingsPage from "./pages/SavingsPage";

// Componentes de layout
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const isDark = useThemeStore((s) => s.isDark);

  // Aplicar clase 'dark' al HTML al cargar
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      {/* Toaster muestra notificaciones tipo toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            background: "#fff",
            color: "#111827",
            fontSize: "0.875rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          },
          className: "dark:!bg-gray-900 dark:!text-white dark:!border-gray-800",
          duration: 3000,
        }}
      />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas - envueltas en Layout (sidebar + contenido) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/savings" element={<SavingsPage />} />
        </Route>

        {/* Redirigir la raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
