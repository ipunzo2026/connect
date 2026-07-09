import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';
import { verificarToken, esAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/planes - Obtener todos los planes (con conteo de clientes activos)
router.get('/', verificarToken, (req, res) => {
  try {
    const planes = db.prepare(`
      SELECT p.*, COUNT(c.id) as total_clientes 
      FROM planes p
      LEFT JOIN clientes c ON p.id = c.plan_id AND c.activo = 1
      GROUP BY p.id
    `).all();
    res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ error: 'Error al obtener los planes.' });
  }
});

// POST /api/planes - Crear un plan (Solo Admin)
router.post('/', verificarToken, esAdmin, (req, res) => {
  const { nombre, precio, velocidad } = req.body;

  if (!nombre || precio === undefined || !velocidad) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
  }

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO planes (id, nombre, precio, velocidad)
      VALUES (?, ?, ?, ?)
    `).run(id, nombre, parseFloat(precio), velocidad);

    res.status(201).json({ id, nombre, precio, velocidad });
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ error: 'Error al crear el plan.' });
  }
});

// PUT /api/planes/:id - Editar un plan (Solo Admin)
router.put('/:id', verificarToken, esAdmin, (req, res) => {
  const { id } = req.params;
  const { nombre, precio, velocidad } = req.body;

  if (!nombre || precio === undefined || !velocidad) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
  }

  try {
    const plan = db.prepare('SELECT * FROM planes WHERE id = ?').get(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    db.prepare(`
      UPDATE planes 
      SET nombre = ?, precio = ?, velocidad = ?
      WHERE id = ?
    `).run(nombre, parseFloat(precio), velocidad, id);

    res.json({ id, nombre, precio, velocidad });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ error: 'Error al actualizar el plan.' });
  }
});

// DELETE /api/planes/:id - Eliminar un plan (Solo Admin)
router.delete('/:id', verificarToken, esAdmin, (req, res) => {
  const { id } = req.params;

  try {
    const plan = db.prepare('SELECT * FROM planes WHERE id = ?').get(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado.' });
    }

    // Verificar si hay clientes asociados (incluso inactivos)
    const clientesAsociados = db.prepare('SELECT COUNT(*) as count FROM clientes WHERE plan_id = ?').get(id);
    if (clientesAsociados.count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el plan porque tiene ${clientesAsociados.count} clientes asociados. Reasigna a los clientes antes de eliminar.` 
      });
    }

    db.prepare('DELETE FROM planes WHERE id = ?').run(id);
    res.json({ message: 'Plan eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ error: 'Error al eliminar el plan.' });
  }
});

export default router;
