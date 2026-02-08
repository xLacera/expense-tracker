// Cliente HTTP (Axios) configurado para hablar con el backend.
// El interceptor agrega automáticamente el token JWT a cada petición.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Crear instancia de Axios con la URL base
const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de peticiones: agrega el token JWT si existe.
// Esto se ejecuta ANTES de cada petición HTTP.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuestas: si recibimos un 401 (no autorizado),
// limpiamos el token y redirigimos al login.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
