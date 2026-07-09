-- Esquema de Base de Datos para ISP Manager (SQLite)

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cobrador'
);

CREATE TABLE IF NOT EXISTS planes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  velocidad TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  colonia TEXT,
  plan_id TEXT,
  precio_mensual REAL NOT NULL,
  dia_pago INTEGER NOT NULL,
  fecha_alta TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  notas TEXT,
  FOREIGN KEY (plan_id) REFERENCES planes(id)
);

CREATE TABLE IF NOT EXISTS pagos (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  mes TEXT NOT NULL, -- Formato: YYYY-MM
  fecha_pago TEXT NOT NULL, -- Formato: YYYY-MM-DD
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL, -- 'Efectivo', 'Transferencia', 'Otro'
  notes TEXT, -- Notas opcionales
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
