import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ruta de la base de datos (por defecto server/db/database.sqlite)
const dbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH) 
  : path.join(__dirname, 'database.sqlite');

// Asegurar que el directorio de la BD exista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[Database] Conectando a SQLite en: ${dbPath}`);
const db = new Database(dbPath);

// Habilitar claves foráneas en SQLite
db.pragma('foreign_keys = ON');

// Inicializar el esquema
const schemaPath = path.join(__dirname, 'init.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('[Database] Esquema de base de datos cargado correctamente.');
} else {
  console.error('[Database] ERROR: No se encontró init.sql');
}

// Función para sembrar datos de prueba si la base de datos está vacía
function seedDatabase() {
  // Verificar si ya hay usuarios creados
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (userCheck.count > 0) {
    console.log('[Database] La base de datos ya contiene datos, omitiendo siembra.');
    return;
  }

  console.log('[Database] Base de datos vacía. Sembrando datos iniciales...');

  // 1. Insertar Usuarios
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const cobradorPassword = bcrypt.hashSync('juan123', 10);
  
  const insertUser = db.prepare(`
    INSERT INTO usuarios (id, usuario, nombre, password, rol) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const adminId = uuidv4();
  const cobradorId = uuidv4();
  
  insertUser.run(adminId, 'admin', 'Administrador General', adminPassword, 'admin');
  insertUser.run(cobradorId, 'juan', 'Juan Pérez (Cobrador)', cobradorPassword, 'cobrador');
  console.log('[Database Seed] Usuarios creados.');

  // 2. Insertar Planes
  const insertPlan = db.prepare(`
    INSERT INTO planes (id, nombre, precio, velocidad) 
    VALUES (?, ?, ?, ?)
  `);

  const planBasicoId = uuidv4();
  const planEstandarId = uuidv4();
  const planPremiumId = uuidv4();

  insertPlan.run(planBasicoId, 'Básico 10 Mbps', 200.00, '10 Mbps');
  insertPlan.run(planEstandarId, 'Estándar 20 Mbps', 300.00, '20 Mbps');
  insertPlan.run(planPremiumId, 'Premium 50 Mbps', 450.00, '50 Mbps');
  console.log('[Database Seed] Planes de internet creados.');

  // 3. Insertar Clientes (15 de ejemplo)
  const insertCliente = db.prepare(`
    INSERT INTO clientes (id, nombre, telefono, direccion, colonia, plan_id, precio_mensual, dia_pago, fecha_alta, activo, notas) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const colonias = ['Centro', 'Las Flores', 'El Mirador', 'San Ángel', 'Lomas Altas'];
  const planes = [
    { id: planBasicoId, precio: 200.00 },
    { id: planEstandarId, precio: 300.00 },
    { id: planPremiumId, precio: 450.00 }
  ];

  const clientesData = [
    { nombre: 'Carlos Mendoza', tel: '555-0199', dir: 'Av. Juárez 123', dia: 5, notas: 'Cliente puntual' },
    { nombre: 'María Rodríguez', tel: '555-0122', dir: 'Calle Rosas 45', dia: 10, notas: 'Pide recibo impreso' },
    { nombre: 'Jorge Hernández', tel: '555-0144', dir: 'Blvd. Encinos 789', dia: 15, notas: 'Requiere soporte de router ocasional' },
    { nombre: 'Ana Gómez', tel: '555-0155', dir: 'Av. Constitución 432', dia: 5, notas: '' },
    { nombre: 'Luis Martínez', tel: '555-0166', dir: 'Privada Violeta 12', dia: 20, notas: 'Estudiante' },
    { nombre: 'Sofía Castro', tel: '555-0177', dir: 'Calle Pino 99', dia: 25, notas: '' },
    { nombre: 'Roberto Sánchez', tel: '555-0188', dir: 'Av. Central 876', dia: 10, notas: 'Negocio local' },
    { nombre: 'Elena Vázquez', tel: '555-0111', dir: 'Calle Fresno 54', dia: 15, notas: '' },
    { nombre: 'Miguel Ángel Torres', tel: '555-0133', dir: 'Av. De la Paz 34', dia: 5, notas: 'Paga con transferencia siempre' },
    { nombre: 'Patricia Luna', tel: '555-0211', dir: 'Calle Hortensia 101', dia: 20, notas: '' },
    { nombre: 'Daniel Ortiz', tel: '555-0222', dir: 'Av. Arboledas 77', dia: 28, notas: 'Cliente inactivo temporalmente', activo: 0 },
    { nombre: 'Gabriela Silva', tel: '555-0233', dir: 'Calle Olmo 23', dia: 12, notas: '' },
    { nombre: 'Fernando Ruiz', tel: '555-0244', dir: 'Calle Magnolia 88', dia: 18, notas: 'Familiar del administrador' },
    { nombre: 'Lucía Meza', tel: '555-0255', dir: 'Av. del Sol 405', dia: 10, notas: '' },
    { nombre: 'Alejandro Domínguez', tel: '555-0266', dir: 'Calle Encino 30', dia: 22, notas: 'Nuevo registro' }
  ];

  const creados = [];

  const today = new Date();
  const formatDate = (date) => date.toISOString().slice(0, 10);

  clientesData.forEach((c, index) => {
    const id = uuidv4();
    // Alternar planes
    const plan = planes[index % planes.length];
    const colonia = colonias[index % colonias.length];
    const activo = c.activo !== undefined ? c.activo : 1;
    
    // Fecha de alta hace 4 meses
    const fechaAlta = new Date();
    fechaAlta.setMonth(today.getMonth() - 4);

    insertCliente.run(
      id,
      c.nombre,
      c.tel,
      c.dir,
      colonia,
      plan.id,
      plan.precio,
      c.dia,
      formatDate(fechaAlta),
      activo,
      c.notas
    );

    if (activo === 1) {
      creados.push({ id, dia_pago: c.dia, precio: plan.precio });
    }
  });
  console.log('[Database Seed] Clientes creados.');

  // 4. Insertar Pagos Históricos (Últimos 3 meses)
  const insertPago = db.prepare(`
    INSERT INTO pagos (id, cliente_id, mes, fecha_pago, monto, metodo_pago, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const metodos = ['Efectivo', 'Transferencia', 'Otro'];

  // Obtener nombres de los meses relativos
  // Mes 0 (Mes actual), Mes -1 (Mes anterior), Mes -2 (Hace 2 meses)
  for (let m = -2; m <= 0; m++) {
    const targetMonthDate = new Date();
    targetMonthDate.setMonth(today.getMonth() + m);
    
    const mesStr = targetMonthDate.toISOString().slice(0, 7); // YYYY-MM
    const currentDay = today.getDate();

    creados.forEach((cli, idx) => {
      // Simular pagos
      // Mes -2 y Mes -1: todos pagados excepto 1 cliente en Mes -1
      // Mes 0: algunos pagaron si su día de pago ya pasó, otros no
      let debePagar = true;
      
      if (m === -1 && idx === 4) {
        debePagar = false; // El quinto cliente no pagó el mes pasado
      }

      if (m === 0) {
        // En el mes actual, solo pagan algunos de los que ya pasaron su dia_pago,
        // o aleatoriamente algunos que pagan temprano.
        if (cli.dia_pago > currentDay) {
          // El día de pago es en el futuro. Algunos pagan por adelantado (30% de probabilidad)
          debePagar = Math.random() < 0.3;
        } else {
          // El día de pago ya pasó. El 80% pagó a tiempo, el 20% son deudores vencidos
          debePagar = Math.random() < 0.8;
        }
      }

      if (debePagar) {
        const fechaPago = new Date(targetMonthDate);
        // Paga alrededor de su dia de pago (entre dia - 2 y dia + 3)
        const offset = Math.floor(Math.random() * 6) - 2; // -2 a +3
        let payDay = cli.dia_pago + offset;
        if (payDay < 1) payDay = 1;
        if (payDay > 28) payDay = 28; // Evitar desbordar mes
        
        fechaPago.setDate(payDay);

        // Si la fecha calculada supera el día de hoy para el mes actual, ajustar al día de hoy
        if (m === 0 && fechaPago > today) {
          fechaPago.setDate(today.getDate());
        }

        insertPago.run(
          uuidv4(),
          cli.id,
          mesStr,
          formatDate(fechaPago),
          cli.precio,
          metodos[idx % metodos.length],
          'Pago registrado por semilla automatica'
        );
      }
    });
  }
  console.log('[Database Seed] Pagos históricos creados.');
}

// Ejecutar semilla
seedDatabase();

export default db;
