# ============================================
# Dockerfile para el backend en Go
# Usa Go 1.23 con hot-reload usando air
# ============================================

FROM golang:1.24-alpine

# Instalar air para hot-reload (recarga automática al cambiar código)
RUN go install github.com/air-verse/air@v1.61.7

WORKDIR /app

# Copiar archivos de dependencias primero (para cache de Docker)
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código
COPY . .

# Puerto que expone el backend
EXPOSE 8080

# Usar air para desarrollo con hot-reload
CMD ["air", "-c", ".air.toml"]
