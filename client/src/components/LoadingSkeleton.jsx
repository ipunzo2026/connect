import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-panel rounded-2xl p-6 border border-brand-border animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-slate-800"></div>
      <div className="w-20 h-4 bg-slate-800 rounded"></div>
    </div>
    <div className="w-24 h-8 bg-slate-800 rounded mb-2"></div>
    <div className="w-32 h-4 bg-slate-800 rounded"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-900 border-b border-brand-border"></div>
    <div className="divide-y divide-brand-border">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="h-16 flex items-center px-6 gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div 
              key={cIdx} 
              className={`h-4 bg-slate-800 rounded ${cIdx === 0 ? 'w-1/3' : 'w-1/6'}`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-panel rounded-2xl p-6 border border-brand-border h-[350px] flex flex-col justify-between animate-pulse">
    <div className="w-48 h-6 bg-slate-800 rounded mb-4"></div>
    <div className="flex-1 flex items-end gap-3 px-4 pb-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div 
          key={idx} 
          className="flex-1 bg-slate-800 rounded-t-lg"
          style={{ height: `${20 + idx * 12}%` }}
        ></div>
      ))}
    </div>
  </div>
);
