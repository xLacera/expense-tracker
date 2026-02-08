// Store del tema (claro/oscuro).
// Guarda la preferencia en localStorage para que persista entre sesiones.

import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark:
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches),

  toggle: () => {
    set((state) => {
      const newDark = !state.isDark;
      localStorage.setItem("theme", newDark ? "dark" : "light");

      // Agregar/quitar clase 'dark' en el <html>
      if (newDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return { isDark: newDark };
    });
  },
}));
