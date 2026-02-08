# ============================================
# Dockerfile para el frontend en React
# Usa Node 20 con hot-reload de Vite
# ============================================

FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias primero (para cache de Docker)
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Puerto que expone Vite en desarrollo
EXPOSE 5173

# Arrancar Vite en modo desarrollo
CMD ["npm", "run", "dev"]
