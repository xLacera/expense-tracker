// Layout principal: sidebar (desktop) + bottom nav (mobile) + top bar + contenido.
// Mobile-first: bottom navigation en móvil, sidebar en pantallas grandes.

import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  BarChart3,
  PiggyBank,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

// Navegación completa (sidebar en desktop)
const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Panel" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Movimientos" },
  { to: "/savings", icon: PiggyBank, label: "Ahorros" },
  { to: "/categories", icon: Tags, label: "Categorías" },
  { to: "/budgets", icon: Wallet, label: "Presupuestos" },
  { to: "/reports", icon: BarChart3, label: "Reportes" },
];

// Bottom nav en mobile (máximo 5 items para que quepan bien)
const mobileNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Panel" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Movimientos" },
  { to: "/savings", icon: PiggyBank, label: "Ahorros" },
  { to: "/budgets", icon: Wallet, label: "Presupuestos" },
  { to: "/reports", icon: BarChart3, label: "Reportes" },
];

// Mapeo de ruta a título para el top bar
const pageTitles: Record<string, string> = {
  "/dashboard": "Panel principal",
  "/transactions": "Transacciones",
  "/savings": "Ahorros",
  "/categories": "Categorías",
  "/budgets": "Presupuestos",
  "/reports": "Reportes",
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentTitle = pageTitles[location.pathname] || "Expense Tracker";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ===== SIDEBAR — solo visible en desktop (lg+) ===== */}
      <aside className="hidden lg:flex lg:static w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Wallet className="w-5 h-5 text-gray-900 dark:text-white mr-2.5" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Expense Tracker
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white w-full transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {isDark ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo mini solo en mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-900 dark:text-white" />
            </div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón modo oscuro en mobile */}
            <button
              onClick={toggle}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {/* Logout en mobile */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {user?.name}
            </span>
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Contenido de la página — padding-bottom extra en mobile para el bottom nav */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* ===== BOTTOM NAVIGATION — solo visible en mobile (< lg) ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-md transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800"
                        : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
