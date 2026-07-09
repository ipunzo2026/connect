import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  AlertTriangle, 
  DollarSign, 
  Smartphone, 
  MapPin, 
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const Deudores = () => {
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal Pago Rápido
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cliente_id: '',
    mes: '',
    fecha_pago: '',
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
      const data = await api.get('/pagos/deudores');
      setDeudores(data);
    } catch (err) {
      console.error(err);
      triggerToast('Error al cargar la lista de deudores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (cliente) => {
    setSelectedCliente(cliente);
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentDate = now.toISOString().slice(0, 10);

    setPaymentData({
      cliente_id: cliente.id,
      mes: currentMonth,
      fecha_pago: currentDate,
      monto: cliente.precio_mensual,
      metodo_pago: 'Efectivo',
      notas: 'Pago deudor rápido'
    });
    setIsPaymentOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pagos', paymentData);
      setIsPaymentOpen(false);
      triggerToast('Cobro registrado y saldo actualizado.');
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Error al guardar cobro.', 'error');
    }
  };

  const totalDeudaAcumulada = deudores.reduce((sum, d) => sum + d.monto_adeudado, 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
          <AlertTriangle className="text-red-500 animate-pulse w-8 h-8 shrink-0" />
          Clientes en Mora / Deudores
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Lista de clientes activos que ya pasaron su fecha límite de pago y no registran cobro en el mes en curso.
        </p>
      </div>

      {/* Tarjeta de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-gradient-to-br from-red-950/20 to-rose-950/5 text-red-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cartera Vencida Estimada</span>
          <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">
            ${totalDeudaAcumulada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 mt-2 block">Suma del cargo mensual de los deudores vigentes.</span>
        </div>

        <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-gradient-to-br from-amber-950/20 to-orange-950/5 text-amber-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Clientes Atrasados</span>
          <span className="text-3xl font-extrabold text-slate-100 mt-1 block font-mono">
            {deudores.length} clientes
          </span>
          <span className="text-xs text-slate-500 mt-2 block">Requieren suspensión o llamada de cobranza.</span>
        </div>
      </div>

      {/* Tabla de Deudores */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : deudores.length === 0 ? (
        <div className="glass-panel border border-brand-border rounded-2xl p-12 text-center text-slate-500">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
          <p className="font-semibold text-lg text-emerald-400">¡Al corriente!</p>
          <p className="text-sm mt-1">No se registran clientes con saldo vencido el día de hoy.</p>
        </div>
      ) : (
        <div className="glass-panel border border-brand-border rounded-2xl overflow-hidden shadow-neon-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-brand-border">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Día Límite</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Días de Atraso</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Monto Adeudado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-slate-900/10">
                {deudores.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/20 transition-premium">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-100">{d.nombre}</div>
                      <div className="text-xs text-slate-500 mt-1">{d.colonia || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Smartphone size={14} className="text-slate-500" />
                        <span>{d.telefono || 'Sin teléfono'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                      Día {d.dia_pago}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-400 font-mono">
                      ⚠️ {d.dias_atraso} días
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-500 font-mono">
                      ${d.monto_adeudado}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPaymentModal(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
                      >
                        <DollarSign size={14} /> Cobrar Rápido
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: COBRO RÁPIDO */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Registrar Cobro Rápido">
        {selectedCliente && (
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="bg-red-950/20 p-4 border border-red-500/15 rounded-xl text-slate-300">
              <span className="text-xs text-red-400 font-semibold block uppercase tracking-wider mb-1">Cliente en Mora</span>
              <p className="font-bold text-base text-slate-100">{selectedCliente.nombre}</p>
              <p className="text-xs text-slate-400 mt-1">Día de pago vencido: {selectedCliente.dia_pago}. Días de atraso: {selectedCliente.dias_atraso} días.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mes a Saldar</label>
                <input
                  type="month"
                  required
                  value={paymentData.mes}
                  onChange={(e) => setPaymentData(p => ({ ...p, mes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Pago</label>
                <input
                  type="date"
                  required
                  value={paymentData.fecha_pago}
                  onChange={(e) => setPaymentData(p => ({ ...p, fecha_pago: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monto Recibido ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentData.monto}
                  onChange={(e) => setPaymentData(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Método de Pago</label>
                <select
                  value={paymentData.metodo_pago}
                  onChange={(e) => setPaymentData(p => ({ ...p, metodo_pago: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Comentarios</label>
              <input
                type="text"
                value={paymentData.notas}
                onChange={(e) => setPaymentData(p => ({ ...p, notas: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
              >
                Completar Cobro
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Deudores;
