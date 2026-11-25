import React from 'react';
import { PROVIDER_REGISTRY } from '../../services/mockData';
import { X, Cpu, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ModelRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelRegistryModal: React.FC<ModelRegistryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl slate-glass-card rounded-xl border border-slate-700 p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#D97757]" />
            <h2 className="font-mono text-base font-bold text-slate-100">
              Model & Provider Registry
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {PROVIDER_REGISTRY.map((prov) => (
            <div key={prov.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{prov.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  prov.status === 'healthy' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  {prov.status}
                </span>
              </div>

              <div className="text-slate-400">
                Endpoint URL: <span className="text-slate-200">{prov.endpoint}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">Supported Model Identifiers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {prov.models.map((m) => (
                    <span key={m} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
