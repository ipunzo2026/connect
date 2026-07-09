import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  DollarSign, 
  Calendar, 
  Trash2, 
  AlertCircle,
  Plus,
  ArrowDownToLine,
  TrendingUp,
  Percent
} from 'lucide-react';

const Pagos = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mesFiltro, setMesFiltro] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal de Pago
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    mes: currentMonthStr,
    fecha_pago: new Date().toISOString().slice(0, 10),
    monto: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar pagos del mes seleccionado
      const data = await api.get(`/pagos?mes=${mesFiltro}`);
      setPagos(data);

      // Cargar clientes activos para formulario de registro rápido
      const cliData = await api.get('/clientes?limite=100');
      setClientes(cliData.datos || []);
    } catch (err) {
      console.error(err);
      triggerToast('Error al cargar historial de pagos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mesFiltro]);

  const handleClienteSelect = (cliId) => {
    const cli = clientes.find(c => c.id === cliId);
    setFormData(prev => ({
      ...prev,
      cliente_id: cliId,
      monto: cli ? cli.precio_mensual : ''
    }));
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      triggerToast('Por favor seleccione un cliente.', 'error');
      return;
    }
    try {
      await api.post('/pagos', formData);
      setIsPayOpen(false);
      triggerToast('Pago registrado correctamente.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Error al guardar el pago.', 'error');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas anular este pago? El cliente volverá a tener saldo deudor para este mes.')) return;

    try {
      await api.delete(`/pagos/${id}`);
      triggerToast('Pago anulado exitosamente.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'No se pudo anular el pago.', 'error');
    }
  };

  const totalCobrado = pagos.reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Registro de Pagos</h1>
          <p className="text-slate-400 text-sm mt-1">Historial general de facturación mensual y cobros percibidos.</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              cliente_id: '',
              mes: mesFiltro,
              fecha_pago: new Date().toISOString().slice(0, 10),
              monto: '',
              metodo_pago: 'Efectivo',
              notas: ''
            });
            setIsPayOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:opacity-90 active:scale-[0.98] transition-premium self-start sm:self-auto"
        >
          <Plus size={18} />
          Registrar Cobro
        </button>
      </div>

      {/* Filtros e Información Financiera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selector de Mes */}
        <div className="glass-panel border border-brand-border rounded-2xl p-6 flex flex-col justify-center">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar size={14} /> Seleccionar Período (Mes)
          </label>
          <input
            type="month"
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/30 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-premium text-sm"
          />
        </div>

        {/* Total Cobrado Card */}
        <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-gradient-to-br from-emerald-950/20 to-teal-950/5 text-emerald-400">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              MES: {mesFiltro}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recaudación Total</span>
          <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">
            ${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Transacciones Card */}
        <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-gradient-to-br from-cyan-950/20 to-blue-950/5 text-cyan-400">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/10">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Transacciones</span>
          <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">
            {pagos.length} cobros
          </span>
        </div>
      </div>

      {/* Listado de Pagos */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : pagos.length === 0 ? (
        <div className="glass-panel border border-brand-border rounded-2xl p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-semibold text-lg text-slate-400">Sin pagos registrados</p>
          <p className="text-sm mt-1">No se registran transacciones para el período {mesFiltro}.</p>
        </div>
      ) : (
        <div className="glass-panel border border-brand-border rounded-2xl overflow-hidden shadow-neon-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-brand-border">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Colonia</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Recibo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Método de Pago</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-slate-900/10">
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-950/20 transition-premium">
                    <td className="px-6 py-4 font-bold text-slate-100">{p.cliente_nombre}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{p.cliente_colonia || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{p.plan_nombre || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{p.fecha_pago}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-950 border border-brand-border text-slate-300 font-medium">
                        {p.metodo_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-400 font-mono">
                      ${p.monto}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-2 bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors border border-red-500/10"
                        title="Anular Transacción"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COBRO */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Registrar Cobro Manual">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cliente</label>
            <select
              required
              value={formData.cliente_id}
              onChange={(e) => handleClienteSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Seleccione Cliente Activo --</option>
              {clientes.filter(c => c.activo).map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Día pago: {c.dia_pago} - Plan: {c.plan_nombre})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mes del Servicio</label>
              <input
                type="month"
                required
                value={formData.mes}
                onChange={(e) => setFormData(p => ({ ...p, mes: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Pago</label>
              <input
                type="date"
                required
                value={formData.fecha_pago}
                onChange={(e) => setFormData(p => ({ ...p, fecha_pago: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monto Cobrado ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Método de Pago</label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData(p => ({ ...p, metodo_pago: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas del Pago</label>
            <input
              type="text"
              value={formData.notas}
              onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              placeholder="Ej: Transferencia del banco Azteca"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
            >
              Registrar Transacción
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pagos;
