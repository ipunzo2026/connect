import express from 'express';
import db from '../db/db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats - KPIs del mes actual
router.get('/stats', verificarToken, (req, res) => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const currentDay = today.getDate();

  try {
    // 1. Total clientes activos e inactivos
    const clientesActivosCount = db.prepare('SELECT COUNT(*) as count FROM clientes WHERE activo = 1').get().count;
    
    // 2. Ingresos cobrados este mes (suma de pagos realizados este mes)
    const ingresosCobrados = db.prepare('SELECT SUM(monto) as total FROM pagos WHERE mes = ?').get(currentMonth).total || 0;
    
    // 3. Ingresos esperados este mes (suma de los precios de todos los clientes activos)
    const ingresosEsperados = db.prepare('SELECT SUM(precio_mensual) as total FROM clientes WHERE activo = 1').get().total || 0;
    
    // 4. Clientes que pagaron este mes (al corriente)
    const pagadosCount = db.prepare(`
      SELECT COUNT(DISTINCT cliente_id) as count 
      FROM pagos 
      WHERE mes = ? AND cliente_id IN (SELECT id FROM clientes WHERE activo = 1)
    `).get(currentMonth).count;

    // 5. Clientes cuya fecha de pago ya pasó y no han pagado (vencidos)
    const vencidosCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM clientes c
      LEFT JOIN pagos pag ON c.id = pag.cliente_id AND pag.mes = ?
      WHERE c.activo = 1 AND c.dia_pago <= ? AND pag.id IS NULL
    `).get(currentMonth, currentDay).count;

    // 6. Clientes pendientes (aún no pagan pero no ha vencido su día de pago)
    const pendientesCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM clientes c
      LEFT JOIN pagos pag ON c.id = pag.cliente_id AND pag.mes = ?
      WHERE c.activo = 1 AND c.dia_pago > ? AND pag.id IS NULL
    `).get(currentMonth, currentDay).count;

    res.json({
      clientesActivos: clientesActivosCount,
      clientesAlCorriente: pagadosCount,
      clientesPendientes: pendientesCount,
      clientesVencidos: vencidosCount,
      ingresosCobrados,
      ingresosEsperados
    });
  } catch (error) {
    console.error('Error al obtener KPIs de dashboard:', error);
    res.status(500).json({ error: 'Error al procesar estadísticas de dashboard.' });
  }
});

// GET /api/estadisticas - Datos detallados para gráficos
router.get('/estadisticas', verificarToken, (req, res) => {
  const today = new Date();
  
  // Rango de fechas por defecto: últimos 6 meses
  let { desde, hasta } = req.query;
  
  if (!hasta) {
    hasta = today.toISOString().slice(0, 7); // Mes actual
  }
  if (!desde) {
    const haceSeisMeses = new Date();
    haceSeisMeses.setMonth(today.getMonth() - 5);
    desde = haceSeisMeses.toISOString().slice(0, 7); // Hace 5 meses
  }

  try {
    // 1. Ingresos mensuales
    // Obtenemos todos los pagos en el rango de meses
    const ingresosMensuales = db.prepare(`
      SELECT mes, SUM(monto) as total_monto, COUNT(id) as total_pagos
      FROM pagos
      WHERE mes >= ? AND mes <= ?
      GROUP BY mes
      ORDER BY mes ASC
    `).all(desde, hasta);

    // 2. Distribución de clientes por plan
    const distribucionPlanes = db.prepare(`
      SELECT p.nombre as name, COUNT(c.id) as value
      FROM planes p
      LEFT JOIN clientes c ON p.id = c.plan_id AND c.activo = 1
      GROUP BY p.id
    `).all();

    // 3. Distribución de clientes por colonia
    const distribucionColonias = db.prepare(`
      SELECT colonia as name, COUNT(id) as value
      FROM clientes
      WHERE activo = 1 AND colonia IS NOT NULL AND colonia != ''
      GROUP BY colonia
      ORDER BY value DESC
    `).all();

    // 4. Clientes nuevos por mes
    const nuevosClientes = db.prepare(`
      SELECT strftime('%Y-%m', fecha_alta) as mes, COUNT(id) as count
      FROM clientes
      WHERE mes >= ? AND mes <= ?
      GROUP BY mes
      ORDER BY mes ASC
    `).all(desde, hasta);

    // 5. Tasa de cobro histórica por mes (monto cobrado vs monto esperado)
    // Para simplificar, calculamos el monto esperado histórico basado en el precio actual de clientes activos en cada mes.
    // Buscaremos los pagos hechos por cada mes contra la suma de precios de clientes activos en ese mes
    // (o clientes cuya fecha de alta sea anterior o igual a ese mes)
    const listaMeses = [];
    let tempDate = new Date(desde + '-02'); // evitar desbordamientos de zona horaria
    const endDate = new Date(hasta + '-02');
    
    while (tempDate <= endDate) {
      listaMeses.push(tempDate.toISOString().slice(0, 7));
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    const tasaCobro = listaMeses.map(m => {
      // Suma de pagos en este mes
      const cobrado = db.prepare('SELECT SUM(monto) as total FROM pagos WHERE mes = ?').get(m).total || 0;
      
      // Suma de precio_mensual de clientes activos en ese mes (dados de alta antes o durante ese mes)
      const activosEnMes = db.prepare(`
        SELECT SUM(precio_mensual) as total 
        FROM clientes 
        WHERE fecha_alta <= ? || '-31' AND (activo = 1 OR (activo = 0 AND id IN (SELECT cliente_id FROM pagos WHERE mes = ?)))
      `).get(m, m).total || 0;

      const tasa = activosEnMes > 0 ? Math.round((cobrado / activosEnMes) * 100) : 0;
      
      return {
        mes: m,
        cobrado,
        esperado: activosEnMes,
        tasa: tasa > 100 ? 100 : tasa // Capped at 100%
      };
    });

    res.json({
      ingresosMensuales,
      distribucionPlanes,
      distribucionColonias,
      nuevosClientes,
      tasaCobro
    });
  } catch (error) {
    console.error('Error al obtener estadísticas detalladas:', error);
    res.status(500).json({ error: 'Error al procesar estadísticas detalladas.' });
  }
});

export default router;
