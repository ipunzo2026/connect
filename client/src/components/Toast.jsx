import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-slate-900/90 border-emerald-500/30 text-emerald-400',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
    error: {
      bg: 'bg-slate-900/90 border-red-500/30 text-red-400',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-cyan-500/30 text-cyan-400',
      icon: <AlertCircle className="w-5 h-5 text-cyan-500" />,
    },
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <div className="fixed top-5 right-5 z-50 animate-bounce duration-500">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass-panel shadow-2xl transition-all duration-300 max-w-sm ${currentStyle.bg}`}
      >
        <div className="shrink-0">{currentStyle.icon}</div>
        <div className="text-sm font-medium text-slate-100 flex-1">{message}</div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
