import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/pagos - Listado global de pagos por mes
router.get('/', verificarToken, (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { mes = currentMonth } = req.query;

  try {
    const pagos = db.prepare(`
      SELECT pag.*, c.nombre as cliente_nombre, c.colonia as cliente_colonia, p.nombre as plan_nombre
      FROM pagos pag
      JOIN clientes c ON pag.cliente_id = c.id
      LEFT JOIN planes p ON c.plan_id = p.id
      WHERE pag.mes = ?
      ORDER BY pag.fecha_pago DESC
    `).all(mes);

    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener los pagos.' });
  }
});

// GET /api/deudores - Listado de clientes con pago vencido
router.get('/deudores', verificarToken, (req, res) => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const currentDay = today.getDate();

  try {
    // Clientes activos cuya fecha de pago ya pasó y no registran pago este mes
    const deudores = db.prepare(`
      SELECT c.*, p.nombre as plan_nombre
      FROM clientes c
      LEFT JOIN planes p ON c.plan_id = p.id
      LEFT JOIN pagos pag ON c.id = pag.cliente_id AND pag.mes = ?
      WHERE c.activo = 1
        AND c.dia_pago <= ?
        AND pag.id IS NULL
      ORDER BY c.dia_pago ASC
    `).all(currentMonth, currentDay);

    // Calcular días de atraso y monto
    const deudoresProcesados = deudores?.map(d => {
      // Si el día de pago es menor al día actual, la diferencia son los días de atraso
      const diasAtraso = currentDay - d.dia_pago;
      return {
        ...d,
        activo: d.activo === 1,
        dias_atraso: diasAtraso,
        monto_adeudado: d.precio_mensual
      };
    });

    res.json(deudoresProcesados);
  } catch (error) {
    console.error('Error al obtener deudores:', error);
    res.status(500).json({ error: 'Error al obtener la lista de deudores.' });
  }
});

// POST /api/pagos - Registrar pago
router.post('/', verificarToken, (req, res) => {
  const { cliente_id, mes, fecha_pago, monto, metodo_pago, notas } = req.body;

  if (!cliente_id || !mes || !fecha_pago || monto === undefined || !metodo_pago) {
    return res.status(400).json({ error: 'Los campos cliente_id, mes, fecha_pago, monto y metodo_pago son requeridos.' });
  }

  // Validar formato del mes YYYY-MM
  const mesRegex = /^\d{4}-\d{2}$/;
  if (!mesRegex.test(mes)) {
    return res.status(400).json({ error: 'El formato del mes debe ser YYYY-MM.' });
  }

  // Validar formato de la fecha YYYY-MM-DD
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha_pago)) {
    return res.status(400).json({ error: 'El formato de la fecha de pago debe ser YYYY-MM-DD.' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo.' });
  }

  try {
    // Verificar si el cliente existe y está activo
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Verificar si ya tiene pago registrado para ese mes
    const pagoExistente = db.prepare('SELECT id FROM pagos WHERE cliente_id = ? AND mes = ?').get(cliente_id, mes);
    if (pagoExistente) {
      return res.status(400).json({ error: `El cliente ya cuenta con un pago registrado para el mes ${mes}.` });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO pagos (id, cliente_id, mes, fecha_pago, monto, metodo_pago, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, cliente_id, mes, fecha_pago, montoNum, metodo_pago, notas || '');

    res.status(201).json({ id, cliente_id, mes, fecha_pago, monto: montoNum, metodo_pago });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago.' });
  }
});

// PUT /api/pagos/:id - Editar pago
router.put('/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { mes, fecha_pago, monto, metodo_pago, notas } = req.body;

  if (!mes || !fecha_pago || monto === undefined || !metodo_pago) {
    return res.status(400).json({ error: 'Los campos mes, fecha_pago, monto y metodo_pago son requeridos.' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo.' });
  }

  try {
    const pago = db.prepare('SELECT * FROM pagos WHERE id = ?').get(id);
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    // Si cambió de mes, verificar que no haya otro pago registrado en ese nuevo mes
    if (mes !== pago.mes) {
      const pagoExistente = db.prepare('SELECT id FROM pagos WHERE cliente_id = ? AND mes = ? AND id != ?')
        .get(pago.cliente_id, mes, id);
      if (pagoExistente) {
        return res.status(400).json({ error: `El cliente ya cuenta con otro pago registrado para el mes ${mes}.` });
      }
    }

    db.prepare(`
      UPDATE pagos
      SET mes = ?, fecha_pago = ?, monto = ?, metodo_pago = ?, notes = ?
      WHERE id = ?
    `).run(mes, fecha_pago, montoNum, metodo_pago, notas || '', id);

    res.json({ id, cliente_id: pago.cliente_id, mes, fecha_pago, monto: montoNum, metodo_pago });
  } catch (error) {
    console.error('Error al editar pago:', error);
    res.status(500).json({ error: 'Error al actualizar el pago.' });
  }
});

// DELETE /api/pagos/:id - Anular / eliminar pago
router.delete('/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  try {
    const pago = db.prepare('SELECT * FROM pagos WHERE id = ?').get(id);
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    db.prepare('DELETE FROM pagos WHERE id = ?').run(id);
    res.json({ message: 'Pago anulado correctamente.' });
  } catch (error) {
    console.error('Error al anular pago:', error);
    res.status(500).json({ error: 'Error al anular el pago.' });
  }
});

export default router;
