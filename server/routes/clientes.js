import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clientes - Listado con filtros y búsqueda
router.get('/', verificarToken, (req, res) => {
  const { buscar, estado, limite = 100, pagina = 1 } = req.query;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentDay = new Date().getDate();

  try {
    // 1. Obtener todos los clientes con su plan y si pagaron este mes
    const query = db.prepare(`
      SELECT c.*, p.nombre as plan_nombre, p.precio as plan_precio, 
             pag.id as pago_este_mes_id, pag.fecha_pago as pago_este_mes_fecha, pag.monto as pago_este_mes_monto
      FROM clientes c
      LEFT JOIN planes p ON c.plan_id = p.id
      LEFT JOIN pagos pag ON c.id = pag.cliente_id AND pag.mes = ?
      ORDER BY c.nombre ASC
    `);
    
    let clientes = query.all(currentMonth);

    // 2. Procesar el estado de cada cliente en JS
    clientes = clientes.map(c => {
      let estadoCliente = 'pendiente';
      const pagado = !!c.pago_este_mes_id;

      if (c.activo === 0) {
        estadoCliente = 'inactivo';
      } else if (pagado) {
        estadoCliente = 'al_corriente';
      } else if (c.dia_pago > currentDay) {
        estadoCliente = 'pendiente';
      } else {
        estadoCliente = 'vencido';
      }

      return {
        ...c,
        activo: c.activo === 1,
        estado: estadoCliente
      };
    });

    // 3. Aplicar filtros de búsqueda (nombre, colonia, plan_nombre)
    if (buscar) {
      const searchLower = buscar.toString().toLowerCase();
      clientes = clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchLower) ||
        (c.colonia && c.colonia.toLowerCase().includes(searchLower)) ||
        (c.plan_nombre && c.plan_nombre.toLowerCase().includes(searchLower))
      );
    }

    // 4. Filtrar por estado (todos / al_corriente / pendiente / vencido / inactivo)
    if (estado && estado !== 'todos') {
      clientes = clientes.filter(c => c.estado === estado);
    } else if (!estado) {
      // Por defecto no mostrar inactivos a menos que se pida 'inactivo' o 'todos'
      clientes = clientes.filter(c => c.estado !== 'inactivo');
    }

    // 5. Paginación manual en JS
    const totalResultados = clientes.length;
    const pag = parseInt(pagina);
    const lim = parseInt(limite);
    const offset = (pag - 1) * lim;
    const paginados = clientes.slice(offset, offset + lim);

    res.json({
      datos: paginados,
      paginacion: {
        total: totalResultados,
        pagina: pag,
        limite: lim,
        paginas: Math.ceil(totalResultados / lim)
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});

// GET /api/clientes/:id - Obtener detalle del cliente
router.get('/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  try {
    const cliente = db.prepare(`
      SELECT c.*, p.nombre as plan_nombre, p.precio as plan_precio,
             pag.id as pago_este_mes_id, pag.fecha_pago as pago_este_mes_fecha
      FROM clientes c
      LEFT JOIN planes p ON c.plan_id = p.id
      LEFT JOIN pagos pag ON c.id = pag.cliente_id AND pag.mes = ?
      WHERE c.id = ?
    `).get(currentMonth, id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Calcular estado
    let estadoCliente = 'pendiente';
    const pagado = !!cliente.pago_este_mes_id;
    if (cliente.activo === 0) {
      estadoCliente = 'inactivo';
    } else if (pagado) {
      estadoCliente = 'al_corriente';
    } else if (cliente.dia_pago > currentDay) {
      estadoCliente = 'pendiente';
    } else {
      estadoCliente = 'vencido';
    }

    cliente.activo = cliente.activo === 1;
    cliente.estado = estadoCliente;

    // Obtener historial de pagos
    const pagos = db.prepare(`
      SELECT id, mes, fecha_pago, monto, metodo_pago, notes
      FROM pagos
      WHERE cliente_id = ?
      ORDER BY mes DESC
    `).all(id);

    res.json({
      cliente,
      pagos
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener detalle del cliente.' });
  }
});

// POST /api/clientes - Registrar nuevo cliente
router.post('/', verificarToken, (req, res) => {
  const { nombre, telefono, direccion, colonia, plan_id, precio_mensual, dia_pago, notas } = req.body;

  if (!nombre || !plan_id || precio_mensual === undefined || !dia_pago) {
    return res.status(400).json({ error: 'Los campos nombre, plan, precio mensual y día de pago son requeridos.' });
  }

  const dia = parseInt(dia_pago);
  if (isNaN(dia) || dia < 1 || dia > 31) {
    return res.status(400).json({ error: 'El día de pago debe ser un número entre 1 y 31.' });
  }

  const precio = parseFloat(precio_mensual);
  if (isNaN(precio) || precio < 0) {
    return res.status(400).json({ error: 'El precio mensual debe ser un número positivo.' });
  }

  try {
    // Validar que el plan exista
    const plan = db.prepare('SELECT id FROM planes WHERE id = ?').get(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'El plan especificado no existe.' });
    }

    const id = uuidv4();
    const fechaAlta = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    db.prepare(`
      INSERT INTO clientes (id, nombre, telefono, direccion, colonia, plan_id, precio_mensual, dia_pago, fecha_alta, activo, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, nombre, telefono, direccion, colonia, plan_id, precio, dia, fechaAlta, notas);

    res.status(201).json({ id, nombre, plan_id, precio_mensual: precio, dia_pago: dia });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear el cliente.' });
  }
});

// PUT /api/clientes/:id - Actualizar datos del cliente
router.put('/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, direccion, colonia, plan_id, precio_mensual, dia_pago, activo, notas } = req.body;

  if (!nombre || !plan_id || precio_mensual === undefined || !dia_pago) {
    return res.status(400).json({ error: 'Los campos nombre, plan, precio mensual y día de pago son requeridos.' });
  }

  const dia = parseInt(dia_pago);
  if (isNaN(dia) || dia < 1 || dia > 31) {
    return res.status(400).json({ error: 'El día de pago debe ser un número entre 1 y 31.' });
  }

  const precio = parseFloat(precio_mensual);
  if (isNaN(precio) || precio < 0) {
    return res.status(400).json({ error: 'El precio mensual debe ser un número positivo.' });
  }

  try {
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Validar plan
    const plan = db.prepare('SELECT id FROM planes WHERE id = ?').get(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'El plan especificado no existe.' });
    }

    const estadoActivo = activo === true || activo === 1 ? 1 : 0;

    db.prepare(`
      UPDATE clientes
      SET nombre = ?, telefono = ?, direccion = ?, colonia = ?, plan_id = ?, precio_mensual = ?, dia_pago = ?, activo = ?, notas = ?
      WHERE id = ?
    `).run(nombre, telefono, direccion, colonia, plan_id, precio, dia, estadoActivo, notas, id);

    res.json({ id, nombre, plan_id, precio_mensual: precio, dia_pago: dia, activo: estadoActivo === 1 });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente.' });
  }
});

// DELETE /api/clientes/:id - Soft Delete (Dar de baja)
router.delete('/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  try {
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    db.prepare('UPDATE clientes SET activo = 0 WHERE id = ?').run(id);
    res.json({ message: 'Cliente dado de baja correctamente (desactivado).' });
  } catch (error) {
    console.error('Error al desactivar cliente:', error);
    res.status(500).json({ error: 'Error al dar de baja al cliente.' });
  }
});

// GET /api/clientes/:id/pagos - Obtener historial de pagos específico
router.get('/:id/pagos', verificarToken, (req, res) => {
  const { id } = req.params;

  try {
    const pagos = db.prepare(`
      SELECT id, mes, fecha_pago, monto, metodo_pago, notes
      FROM pagos
      WHERE cliente_id = ?
      ORDER BY mes DESC
    `).all(id);
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    res.status(500).json({ error: 'Error al obtener historial de pagos.' });
  }
});

export default router;
