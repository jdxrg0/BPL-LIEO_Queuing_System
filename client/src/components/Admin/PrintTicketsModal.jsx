import React from 'react';
import { Printer } from 'lucide-react';
import ModalWrapper from '../Modals/ModalWrapper';

export default function PrintTicketsModal({ isOpen, onClose, config, onConfigChange, onGenerate }) {
  const setField = (key, value) => onConfigChange({ ...config, [key]: value });

  return (
    <ModalWrapper isOpen={isOpen} zIndex={1000} bg="rgba(15,23,42,0.6)">
      <div className="bg-surface p-8 rounded-3xl w-[450px] shadow-float border border-border animate-slide-up relative">
        <button onClick={onClose} className="absolute top-6 right-6 bg-slate-100 border-none w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-text-muted hover:text-text-main hover:bg-slate-200 transition-colors">×</button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Printer size={24} />
          </div>
          <h2 className="m-0 text-2xl font-extrabold text-text-main tracking-tight">Print Tickets</h2>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Service Type</label>
          <select
            value={config.type}
            onChange={e => setField('type', e.target.value)}
            className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm"
          >
            <option value="NW">New Business (NW)</option>
            <option value="RNW">Renewal (RNW)</option>
            <option value="R">Retirement (R)</option>
          </select>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Start Number</label>
            <input type="number" min="1" value={config.startNumber} onChange={e => setField('startNumber', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm" />
          </div>
          <div className="flex-1">
            <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Quantity</label>
            <input type="number" min="1" max="200" value={config.quantity} onChange={e => setField('quantity', Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm" />
          </div>
        </div>

        <button
          onClick={onGenerate}
          className="w-full p-4 bg-indigo-600 text-white border-none rounded-xl cursor-pointer font-bold text-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <Printer size={20} /> Generate Page
        </button>
      </div>
    </ModalWrapper>
  );
}