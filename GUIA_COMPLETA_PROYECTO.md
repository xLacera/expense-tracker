# Guía completa del proyecto — Expense Tracker

**Para quien recién empieza:** esta guía explica cada parte del proyecto como si el desarrollador y el CEO te sentaran a una mesa y te contaran todo.

---

## 1. ¿Qué es este proyecto?

Una **app web de finanzas personales**: registrar ingresos y gastos, categorías, presupuestos mensuales, reportes, ahorros en cuentas separadas, y restablecer contraseña por email. Tiene **frontend** (lo que ves en el navegador), **backend** (el servidor que guarda datos y hace la lógica) y **base de datos** (donde se guarda todo).

---

## 2. Estructura de carpetas (qué hay y para qué sirve)

```
prueba-stack/
├── backend/          → Servidor en Go (API REST + base de datos)
├── frontend/         → App que ves en el navegador (React)
├── docker-compose.yml  → Orquesta los 3 servicios (postgres, backend, frontend)
├── .env.example      → Ejemplo de variables de entorno (copiar a .env)
├── .env              → Tus variables reales (no se sube a Git)
├── .gitignore        → Qué archivos/carpetas Git ignora
└── README.md         → Instrucciones del repo
```

- **backend:** todo el “cerebro” del servidor: lógica, API, conexión a la base de datos.
- **frontend:** la interfaz: pantallas, formularios, gráficos, lo que el usuario toca.
- **docker-compose:** define y levanta en tu máquina: base de datos, backend y frontend, con un solo comando.

---

## 3. Backend (Go)

### ¿Qué es Go?

**Go (Golang)** es un lenguaje de programación del servidor. Se compila a un solo ejecutable, es rápido y se usa mucho para APIs y servicios. Aquí el backend está escrito en Go.

### Estructura del backend

```
backend/
├── cmd/server/main.go     → Punto de entrada: conecta DB, corre migraciones, inicia el servidor HTTP
├── go.mod / go.sum        → Dependencias de Go (como package.json en Node)
├── Dockerfile             → Cómo se construye la imagen del backend en desarrollo (con hot-reload)
├── Dockerfile.prod        → Imagen optimizada para producción (Render, etc.)
├── .air.toml              → Configuración de Air (recarga automática al cambiar código)
├── migrations/            → Archivos SQL que crean/cambian tablas (001, 002, … 008)
└── internal/              → Código interno del proyecto (no es una librería pública)
    ├── config/            → Carga variables de entorno y conexión a la DB
    ├── email/             → Envío de emails (Resend) para OTP de restablecer contraseña
    ├── handlers/          → “Controladores”: reciben la petición HTTP y responden JSON
    ├── middleware/        → Capas que se ejecutan antes del handler (auth, CORS, logs, errores)
    ├── models/            → Estructuras de datos (User, Transaction, Category, etc.)
    ├── repository/        → Acceso a la base de datos (solo SQL, sin lógica de negocio)
    ├── router/            → Define las rutas (URL → handler)
    └── services/         → Lógica de negocio (registro, login, presupuestos, reportes, etc.)
```

### Flujo de una petición en el backend

1. **Cliente** (navegador) hace una petición: por ejemplo `GET /api/transactions`.
2. **Router** recibe la ruta y decide qué handler la atiende.
3. **Middlewares** se ejecutan en orden: CORS, logger, y en rutas protegidas el de **auth** (comprueba el JWT).
4. **Handler** lee el body/query, llama al **service**.
5. **Service** aplica reglas de negocio y usa el **repository** para leer/escribir en la DB.
6. **Repository** ejecuta SQL contra PostgreSQL.
7. La respuesta vuelve como JSON al cliente.

### Dependencias de Go (go.mod)

| Dependencia             | Para qué                                                                      |
| ----------------------- | ----------------------------------------------------------------------------- |
| **gin-gonic/gin**       | Framework HTTP: rutas, middlewares, JSON.                                     |
| **jackc/pgx/v5**        | Driver de PostgreSQL para Go (conexión y consultas).                          |
| **golang-jwt/jwt**      | Crear y validar tokens JWT (login/sesión).                                    |
| **golang.org/x/crypto** | Bcrypt para hashear contraseñas.                                              |
| **gin-contrib/cors**    | Cabeceras CORS (permite que el frontend en otro dominio/puerto llame al API). |

El backend **no** usa un SDK de Resend: envía emails con `net/http` (HTTP estándar de Go) en `internal/email/resend.go`.

### Archivos clave del backend

- **cmd/server/main.go:** arranca la app, carga config, conecta DB, ejecuta migraciones, monta el router y pone el servidor a escuchar.
- **internal/config/config.go:** lee `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `RESEND_API_KEY`, etc.
- **internal/config/database.go:** crea el pool de conexiones a Postgres y la función que ejecuta las migraciones (lee todos los `.sql` en orden).
- **internal/router/router.go:** define todas las rutas públicas y protegidas y qué handler y service usa cada una.
- **internal/middleware/auth.go:** extrae el JWT del header `Authorization`, lo valida y guarda el `user_id` en el contexto para que los handlers sepan quién está logueado.
- **internal/handlers/\*.go:** cada uno recibe la petición, parsea el body, llama al service y devuelve JSON (o error).
- **internal/services/\*.go:** lógica real (crear usuario, validar contraseña, calcular totales, etc.).
- **internal/repository/\*.go:** solo ejecutan SQL (SELECT, INSERT, UPDATE, DELETE) y devuelven datos al service.
- **internal/models/\*.go:** structs que representan usuarios, transacciones, categorías, etc., y los DTOs de request/response.

---

## 4. Frontend (React + TypeScript + Vite)

### ¿Qué es cada cosa?

- **React:** librería para construir la interfaz con componentes (botones, formularios, páginas) que se actualizan cuando cambian los datos.
- **TypeScript:** JavaScript con tipos (te ayuda a evitar errores y tener mejor autocompletado).
- **Vite:** herramienta que compila el proyecto, sirve la app en desarrollo y genera el build para producción (muy rápido).

### Estructura del frontend

```
frontend/
├── index.html           → Página HTML raíz (solo una; React “pinta” todo dentro)
├── package.json         → Dependencias y scripts (npm install, npm run dev, npm run build)
├── vite.config.ts       → Configuración de Vite
├── tsconfig.json        → Configuración de TypeScript
├── vercel.json          → Para Vercel: redirigir todas las rutas a index.html (SPA)
├── public/              → Archivos estáticos (favicon, etc.)
└── src/
    ├── main.tsx         → Punto de entrada: monta la app React en el DOM
    ├── App.tsx          → Rutas (login, register, dashboard, transactions, etc.)
    ├── index.css        → Estilos globales + Tailwind
    ├── api/             → Llamadas al backend (axios)
    │   ├── client.ts     → Cliente HTTP configurado (base URL, JWT en header, redirigir a /login si 401)
    │   ├── auth.ts       → login, register, forgotPassword, resetPassword
    │   ├── categories.ts → CRUD categorías
    │   ├── transactions.ts → CRUD transacciones, export CSV
    │   ├── budgets.ts    → Presupuestos
    │   ├── reports.ts    → Reportes mensuales/anuales
    │   ├── savings.ts    → Cuentas de ahorro
    │   └── user.ts       → getSettings, updateSettings (incluir ahorros en total)
    ├── components/      → Componentes reutilizables
    │   ├── Layout.tsx    → Sidebar + barra superior + navegación móvil
    │   ├── MoneyInput.tsx→ Input formateado para montos (ej. 10.000)
    │   └── ProtectedRoute.tsx → Redirige a /login si no hay token
    ├── pages/           → Una página por ruta
    │   ├── LoginPage.tsx, RegisterPage.tsx, ForgotPasswordPage.tsx
    │   ├── DashboardPage.tsx, TransactionsPage.tsx, CategoriesPage.tsx
    │   ├── BudgetsPage.tsx, ReportsPage.tsx, SavingsPage.tsx
    ├── store/           → Estado global (Zustand)
    │   ├── authStore.ts  → user, token, login, logout, include_savings_in_total
    │   └── themeStore.ts → tema claro/oscuro
    ├── types/index.ts   → Interfaces TypeScript (User, Transaction, Category, etc.)
    └── utils/
        ├── format.ts    → formatCOP, formatDate, formatMonthYear
        └── emojis.ts    → Mapeo ícono → emoji para categorías y ahorros
```

### Dependencias del frontend (package.json)

| Dependencia               | Para qué                                                      |
| ------------------------- | ------------------------------------------------------------- |
| **react** / **react-dom** | Librería y renderizado en el navegador.                       |
| **react-router-dom**      | Rutas (URL → página): /login, /dashboard, /transactions, etc. |
| **axios**                 | Cliente HTTP para llamar al API del backend.                  |
| **zustand**               | Estado global pequeño (usuario logueado, tema) sin Redux.     |
| **lucide-react**          | Iconos (Wallet, Plus, Trash, etc.).                           |
| **react-hot-toast**       | Notificaciones tipo toast (“Guardado”, “Error”).              |
| **recharts**              | Gráficos (barras, líneas, torta) en reportes.                 |
| **tailwindcss**           | Estilos con clases (ej. `bg-gray-100 rounded-lg`).            |
| **vite**                  | Build y servidor de desarrollo.                               |
| **typescript**            | Tipado estático.                                              |

### Flujo en el frontend

1. El usuario abre la app → `main.tsx` monta `App.tsx`.
2. `App.tsx` define las rutas: públicas (login, register, forgot-password) y protegidas (dashboard, transactions, etc.) envueltas en `ProtectedRoute`.
3. Si no hay token y entra a una ruta protegida, `ProtectedRoute` lo manda a `/login`.
4. En login/register se usa `authStore` (Zustand) para guardar `token` y `user` en `localStorage` y en memoria.
5. Cada página que necesita datos llama a `api/*.ts` (que usa el `client` de axios); el client añade el JWT y envía la petición al backend.
6. La respuesta se muestra en la UI (tablas, cards, gráficos).

---

## 5. Base de datos (PostgreSQL) y migraciones SQL

### ¿Qué es PostgreSQL?

Una **base de datos relacional**: guardas datos en **tablas** (usuarios, transacciones, categorías…) con **relaciones** (una transacción pertenece a un usuario y a una categoría). Se habla con ella usando **SQL** (lenguaje estándar para consultas y cambios).

### ¿Qué son las migraciones?

Son **archivos SQL que describen cambios en el esquema** (crear tablas, añadir columnas). No se ejecutan solas al “guardar” el archivo: **alguien tiene que ejecutarlas**. En este proyecto **el backend, al arrancar**, lee la carpeta `migrations/`, ordena los archivos por nombre (001, 002, …) y ejecuta cada uno contra la base de datos (la misma a la que se conecta con `DATABASE_URL`). Por eso “guardar” un `.sql` no cambia la DB; **arrancar el servidor** sí (porque el código de `RunMigrations` hace el `Exec` de cada archivo).

### Tablas (resumen)

| Migración | Qué hace                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- |
| 001       | Tabla **users** (id, email, password_hash, name, created_at, updated_at).                         |
| 002       | Tabla **categories** (por usuario; nombre, color, icono, tipo income/expense).                    |
| 003       | Tabla **transactions** (usuario, categoría, monto, tipo, fecha, descripción, moneda).             |
| 004       | Tabla **budgets** (presupuesto por categoría y mes).                                              |
| 005       | Tabla **savings_accounts** (cuentas de ahorro por usuario, balance, color, icono).                |
| 006       | Añade columna **nickname** a categories.                                                          |
| 007       | Tabla **password_resets** (OTP para restablecer contraseña: user_id, otp_code, expires_at, used). |
| 008       | Añade columna **include_savings_in_total** a users (incluir ahorros en “dinero total”).           |

Las migraciones usan `CREATE TABLE IF NOT EXISTS` y `ADD COLUMN IF NOT EXISTS` para que, si el backend se reinicia y vuelve a ejecutarlas, no fallen.

---

## 6. Docker y Docker Compose

### ¿Qué es Docker?

**Docker** ejecuta la aplicación (y sus dependencias) dentro de **contenedores**: entornos aislados y reproducibles. Así todos tienen el mismo Go, la misma versión de Node, la misma base de datos, sin “en mi máquina sí funciona”.

### ¿Qué es Docker Compose?

**Docker Compose** orquesta **varios contenedores** a la vez. En este proyecto:

| Servicio     | Imagen / build                    | Función                                                                                                 |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **postgres** | postgres:16-alpine                | Base de datos. Puerto 5432, datos en volumen `postgres_data`.                                           |
| **backend**  | build desde `backend/Dockerfile`  | Servidor Go. Usa variables de entorno para DB y JWT. Monta el código con volumen para hot-reload (Air). |
| **frontend** | build desde `frontend/Dockerfile` | App React con Vite. Variable `VITE_API_URL` para saber la URL del API.                                  |

`docker compose up --build` levanta los tres. El backend espera a que Postgres esté “healthy” y luego ejecuta las migraciones al iniciar.

### Archivos Docker

- **docker-compose.yml** (raíz): define los 3 servicios, variables de entorno y volúmenes.
- **backend/Dockerfile:** imagen de desarrollo con Go, Air para recargar al cambiar código.
- **backend/Dockerfile.prod:** imagen mínima para producción (ej. Render).
- **frontend/Dockerfile:** Node, instala dependencias y corre `vite` en desarrollo.

---

## 7. APIs (rutas del backend que usa el frontend)

Todas bajo el prefijo `/api`. Las que requieren login envían el header `Authorization: Bearer <token>`.

### Públicas (sin token)

| Método | Ruta                      | Uso                                              |
| ------ | ------------------------- | ------------------------------------------------ |
| GET    | /api/health               | Comprobar que el servidor responde.              |
| POST   | /api/auth/register        | Registro (email, password, name).                |
| POST   | /api/auth/login           | Login (email, password) → devuelve token y user. |
| POST   | /api/auth/forgot-password | Solicitar OTP por email.                         |
| POST   | /api/auth/reset-password  | Restablecer contraseña con OTP + new_password.   |

### Protegidas (con token JWT)

| Método                                      | Ruta                     | Uso                                                            |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| GET / PATCH                                 | /api/user/settings       | Leer / actualizar preferencias (ej. include_savings_in_total). |
| GET / POST / PUT / DELETE                   | /api/categories          | CRUD categorías.                                               |
| GET / POST / PUT / DELETE                   | /api/transactions        | CRUD transacciones; GET con filtros y paginación.              |
| GET                                         | /api/transactions/export | Exportar transacciones a CSV.                                  |
| GET / POST / DELETE                         | /api/budgets             | Presupuestos por periodo.                                      |
| GET                                         | /api/reports/monthly     | Resumen mensual (ingresos, gastos, balance, por categoría).    |
| GET                                         | /api/reports/yearly      | Resumen anual.                                                 |
| GET / POST / PUT / POST :id/adjust / DELETE | /api/savings             | Cuentas de ahorro y ajuste de balance.                         |

El **cliente** del frontend (`api/client.ts`) pone la base URL (desde `VITE_API_URL` en producción) y el token en cada petición; si el backend responde 401, borra token y redirige a `/login`.

---

## 8. Variables de entorno

- **.env** (no se sube a Git): valores reales en tu máquina o en el host (Render, Vercel, Neon).
- **.env.example**: plantilla para que sepas qué variables existen.

Resumen:

| Variable       | Dónde                | Para qué                                                      |
| -------------- | -------------------- | ------------------------------------------------------------- |
| POSTGRES\_\*   | Backend / Docker     | Conexión a Postgres en desarrollo.                            |
| DATABASE_URL   | Backend (producción) | URL completa de Postgres (ej. Neon).                          |
| JWT_SECRET     | Backend              | Firmar y validar tokens.                                      |
| CORS_ORIGIN    | Backend              | Origen permitido del frontend (ej. URL de Vercel).            |
| RESEND_API_KEY | Backend              | Enviar emails (OTP restablecer contraseña).                   |
| VITE_API_URL   | Frontend             | URL base del API (ej. `https://tu-backend.onrender.com/api`). |

---

## 9. Resumen en una frase por capa

- **Frontend:** React + TypeScript + Vite + Tailwind + Zustand + Axios + React Router + Recharts; habla con el backend por HTTP y guarda el JWT en localStorage.
- **Backend:** Go + Gin + pgx (Postgres) + JWT + bcrypt; recibe peticiones, aplica middlewares (CORS, auth), ejecuta lógica en services y SQL en repositories, y al arrancar ejecuta las migraciones.
- **Base de datos:** PostgreSQL; tablas definidas y evolucionadas con migraciones SQL que el backend ejecuta al iniciar.
- **Docker Compose:** Levanta Postgres, backend y frontend en contenedores para desarrollo local.

Si quieres profundizar en un archivo o flujo concreto (por ejemplo “qué hace exactamente el auth_handler” o “cómo se calcula el balance en el dashboard”), dime cuál y lo desglosamos paso a paso.
