# Expense Tracker - Control de Gastos Personal

Aplicación web completa para registrar y visualizar ingresos y gastos personales en pesos colombianos (COP).

## Stack Tecnológico

| Capa          | Tecnología                               |
| ------------- | ---------------------------------------- |
| Frontend      | React + TypeScript + Vite + Tailwind CSS |
| Estado        | Zustand                                  |
| Gráficas      | Recharts                                 |
| Backend       | Go (Golang) + Gin                        |
| Base de datos | PostgreSQL 16                            |
| Contenedores  | Docker + Docker Compose                  |

## Características

- Registro e inicio de sesión con JWT
- CRUD de categorías personalizadas (con color e ícono)
- CRUD de transacciones (ingresos y gastos)
- Filtros por tipo, categoría y rango de fechas
- Paginación de resultados
- Presupuestos mensuales por categoría con alertas visuales
- Reportes mensuales y anuales con gráficas interactivas
- Exportación a CSV
- Modo oscuro
- Diseño responsive (móvil y escritorio)
- Moneda: COP (pesos colombianos)
- Zona horaria: America/Bogota (UTC-5)

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Puerto 5173 (frontend), 8080 (backend), 5432 (PostgreSQL) disponibles

## Cómo ejecutar

### 1. Clonar o abrir el proyecto

```bash
cd prueba-stack
```

### 2. Crear archivo de variables de entorno

```bash
cp .env.example .env
```

Edita `.env` si quieres cambiar contraseñas o puertos.

### 3. Levantar con Docker Compose

```bash
docker compose up --build
```

Esto levanta 3 contenedores:

- **postgres** en `localhost:5432`
- **backend** en `localhost:8080`
- **frontend** en `localhost:5173`

### 4. Abrir la app

Abre tu navegador en: **http://localhost:5173**

1. Regístrate con tu email y contraseña
2. Crea categorías (comida, transporte, salario, etc.)
3. Registra transacciones
4. Define presupuestos mensuales
5. Ve los reportes

## Estructura del proyecto

```
prueba-stack/
├── docker-compose.yml          # Orquestación de contenedores
├── .env                        # Variables de entorno (no se sube a git)
├── .env.example                # Ejemplo de variables
├── backend/
│   ├── Dockerfile
│   ├── cmd/server/main.go      # Punto de entrada
│   ├── internal/
│   │   ├── config/             # Configuración y conexión a DB
│   │   ├── middleware/         # JWT auth, CORS, logging, errores
│   │   ├── models/             # Estructuras de datos
│   │   ├── handlers/           # Controladores HTTP
│   │   ├── services/           # Lógica de negocio
│   │   ├── repository/         # Queries SQL
│   │   └── router/             # Definición de rutas
│   └── migrations/             # SQL de creación de tablas
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── api/                # Cliente HTTP (Axios)
│   │   ├── store/              # Estado global (Zustand)
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/              # Páginas de la app
│   │   ├── types/              # Tipos TypeScript
│   │   └── utils/              # Formateadores (COP, fechas)
```

## API Endpoints

### Autenticación (públicas)

| Método | Ruta                 | Descripción       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Registrar usuario |
| POST   | `/api/auth/login`    | Iniciar sesión    |

### Categorías (requieren JWT)

| Método | Ruta                  | Descripción          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/categories`     | Listar categorías    |
| POST   | `/api/categories`     | Crear categoría      |
| PUT    | `/api/categories/:id` | Actualizar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría   |

### Transacciones (requieren JWT)

| Método | Ruta                       | Descripción                     |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/api/transactions`        | Listar con filtros y paginación |
| POST   | `/api/transactions`        | Crear transacción               |
| PUT    | `/api/transactions/:id`    | Actualizar transacción          |
| DELETE | `/api/transactions/:id`    | Eliminar transacción            |
| GET    | `/api/transactions/export` | Exportar CSV                    |

### Presupuestos (requieren JWT)

| Método | Ruta                          | Descripción                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/budgets?month=X&year=Y` | Presupuestos del mes         |
| POST   | `/api/budgets`                | Crear/actualizar presupuesto |
| DELETE | `/api/budgets/:id`            | Eliminar presupuesto         |

### Reportes (requieren JWT)

| Método | Ruta                                  | Descripción     |
| ------ | ------------------------------------- | --------------- |
| GET    | `/api/reports/monthly?month=X&year=Y` | Resumen mensual |
| GET    | `/api/reports/yearly?year=Y`          | Resumen anual   |

## Comandos útiles

```bash
# Levantar todo
docker compose up --build

# Levantar en segundo plano
docker compose up --build -d

# Ver logs del backend
docker compose logs -f backend

# Detener todo
docker compose down

# Detener y borrar datos de la DB
docker compose down -v

# Reconstruir solo el backend
docker compose up --build backend
```

## Despliegue

### Backend

Servicios gratuitos recomendados:

- [Fly.io](https://fly.io) - Free tier generoso
- [Render](https://render.com) - Free tier con PostgreSQL
- [Railway](https://railway.app) - $5 crédito mensual gratis

### Frontend

- [Vercel](https://vercel.com) - Gratis para proyectos personales
- [Netlify](https://netlify.com) - Gratis con CI/CD

### Base de datos

- [Neon](https://neon.tech) - PostgreSQL serverless gratis
- [Supabase](https://supabase.com) - PostgreSQL gratis con 500MB
