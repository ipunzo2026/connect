# ISP Manager - Sistema de Gestión de Clientes (SQLite + React)

Este proyecto es un sistema de administración completo para un proveedor de internet local (ISP). Permite llevar el control de clientes, registrar los cobros mensuales, identificar deudores en mora y visualizar reportes analíticos de recaudación y crecimiento del negocio.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React + Vite + Tailwind CSS (Diseño oscuro premium, responsive con animaciones de Lucide Icons)
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (implementado mediante `better-sqlite3` para un almacenamiento local veloz y sin configuraciones complejas)
- **Gráficas:** Recharts (5 tipos de visualizaciones interactivas de KPIs)
- **Autenticación:** JWT (JSON Web Tokens) + Hashing de contraseñas con BcryptJS

---

## 📁 Estructura del Proyecto

```
isp-manager/
├── client/          # Aplicación React + Vite
│   ├── src/
│   │   ├── api/        # Cliente fetch centralizado
│   │   ├── components/ # Componentes (Sidebar, Modales, Skeleton, Toast)
│   │   ├── context/    # Contexto global de Auth
│   │   └── pages/      # Vistas (Dashboard, Clientes, Pagos, Deudores, Planes, Stats)
│   ├── index.html
│   └── tailwind.config.js
├── server/          # Servidor Express + API Rest
│   ├── db/             # Base de datos SQLite (`database.sqlite` se autogenera)
│   │   ├── db.js          # Inicializador y seed/semilla automática
│   │   └── init.sql       # Script de creación de tablas
│   ├── middleware/     # Controladores de sesión (JWT)
│   ├── routes/         # Endpoints de la API
│   └── server.js       # Entrada del servidor
├── package.json     # Scripts raíz para concurrently
└── .env             # Variables de entorno
```

---

## 🚀 Instalación y Uso

### Requisitos Previos
- **Node.js** (Versión 18 o superior recomendada)
- **npm** (Viene integrado con Node.js)

> [!NOTE]
> Al usar **SQLite**, no necesitas instalar ningún servidor de base de datos externo (como MySQL o MariaDB). El archivo de base de datos se creará de forma totalmente automática al iniciar el servidor por primera vez.

### Pasos para Ejecutar Localmente

1. **Clonar o descargar** este directorio en tu máquina local.
2. Abre una terminal en la carpeta raíz del proyecto (`isp-manager/`).
3. **Instalar dependencias globales y de servicios:**
   Ejecuta el script automatizado para instalar todas las dependencias en cascada (raíz, backend y frontend):
   ```bash
   npm run install-all
   ```
4. **Iniciar el entorno de desarrollo:**
   Para levantar el frontend (Vite) y el backend (Express + SQLite) simultáneamente, ejecuta:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador la dirección del portal del frontend:
   [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciales de Acceso (Datos Semilla)

Al iniciar el servidor, si la base de datos está vacía, se sembrarán automáticamente 15 clientes, historial de cobros de los últimos 3 meses y 2 cuentas de usuario iniciales:

1. **Administrador:**
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
   - **Rol:** `admin` (Acceso completo, incluyendo CRUD de planes de internet)

2. **Cobrador / Operador:**
   - **Usuario:** `juan`
   - **Contraseña:** `juan123`
   - **Rol:** `cobrador` (Permisos para registrar cobros, ver deudores y clientes)
