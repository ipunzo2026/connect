import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import planesRoutes from './routes/planes.js';
import clientesRoutes from './routes/clientes.js';
import pagosRoutes from './routes/pagos.js';
import dashboardRoutes from './routes/dashboard.js';
import db from './db/db.js'; // Ejecuta la conexión y la siembra automáticamente

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
// Reemplaza app.use(cors()); por esto:
app.use(cors({
  origin: '*', // Permite que Vercel se conecte sin restricciones
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'], // Registramos la cabecera de Ngrok aquí
  credentials: true
}));
app.use(express.json());

// Logger simple para peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de estado general
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected', time: new Date() });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('[Error General]', err.stack);
  res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SERVIDOR ISP MANAGER CORRIENDO EN PUERTO: ${PORT}`);
  console.log(`=========================================`);
});
