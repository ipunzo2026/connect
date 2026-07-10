import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  Wifi, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Users, 
  Gauge
} from 'lucide-react';

const Planes = () => {
  const { esAdmin } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modales
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', precio: '', velocidad: '' });

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/planes');
      setPlanes(data);
    } catch (err) {
      console.error(err);
      triggerToast('Error al cargar los planes de servicio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormData({ nombre: '', precio: '', velocidad: '' });
    setIsAddOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/planes', formData);
      setIsAddOpen(false);
      triggerToast('Plan creado exitosamente.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Error al crear el plan.', 'error');
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      nombre: plan.nombre,
      precio: plan.precio,
      velocidad: plan.velocidad
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/planes/${selectedPlan.id}`, formData);
      setIsEditOpen(false);
      triggerToast('Plan actualizado correctamente.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Error al actualizar el plan.', 'error');
    }
  };

  const openDeleteModal = (plan) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/planes/${selectedPlan.id}`);
      setIsDeleteOpen(false);
      triggerToast('Plan eliminado correctamente.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Error al eliminar el plan.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            Planes de Internet
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra los planes de servicio de banda ancha ofrecidos por la empresa.
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:opacity-90 active:scale-[0.98] transition-premium self-start sm:self-auto"
          >
            <Plus size={18} />
            Crear Plan
          </button>
        )}
      </div>

      {/* Grid de Planes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TableSkeleton cols={2} rows={3} />
        </div>
      ) : (planes || []).length === 0 ? (
        <div className="glass-panel border border-brand-border rounded-2xl p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-semibold text-lg text-slate-400">Sin planes</p>
          <p className="text-sm mt-1">No se registran planes creados en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes?.map((plan) => (
            <div 
              key={plan.id}
              className="glass-panel border border-brand-border rounded-2xl p-6 bg-gradient-to-b from-[#131524] to-[#0d0f1a] relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 hover:shadow-neon-cyan"
            >
              {/* Top Details */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan-500/10">
                    <Wifi className="w-6 h-6" />
                  </div>
                  {esAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(plan)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/20 rounded-md transition-colors"
                        title="Editar plan"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(plan)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors"
                        title="Eliminar plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-100">{plan.nombre}</h3>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 py-4 border-t border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Velocidad</span>
                      <span className="text-sm font-semibold text-slate-300">{plan.velocidad}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Clientes</span>
                      <span className="text-sm font-semibold text-slate-300">{plan.total_clientes} activos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Monto Mensual:</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">${plan.precio}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREAR PLAN */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Crear Plan de Servicio">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Plan</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              placeholder="Ej: Plan Básico 10M"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Velocidad</label>
              <input
                type="text"
                required
                value={formData.velocidad}
                onChange={(e) => setFormData(p => ({ ...p, velocidad: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="Ej: 10 Mbps"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Precio Mensual ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio}
                onChange={(e) => setFormData(p => ({ ...p, precio: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="Ej: 200.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
            >
              Crear Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDITAR PLAN */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Plan de Servicio">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Plan</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Velocidad</label>
              <input
                type="text"
                required
                value={formData.velocidad}
                onChange={(e) => setFormData(p => ({ ...p, velocidad: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Precio Mensual ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio}
                onChange={(e) => setFormData(p => ({ ...p, precio: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ELIMINAR PLAN */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar Plan de Servicio">
        {selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">¿Seguro que deseas eliminar el plan "{selectedPlan.nombre}"?</p>
                <p className="text-xs text-red-400/80 mt-1">
                  Esta acción eliminará de forma permanente el plan de la base de datos.
                  <strong> Nota:</strong> El sistema impedirá la eliminación si hay clientes asociados a este plan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 text-sm bg-red-600 text-white font-bold rounded-xl hover:bg-red-500"
              >
                Eliminar Plan
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Planes;
