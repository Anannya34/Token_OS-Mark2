import React from 'react';
import { X, Sparkles, ShieldCheck, Terminal, Wrench } from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mcpTools = [
    { name: 'pytest_sandbox_runner', scope: 'Execution Test Sandbox', status: 'ACTIVE', calls: 42, latency: '215ms' },
    { name: 'ast_code_linter', scope: 'Static Analysis AST', status: 'ACTIVE', calls: 128, latency: '45ms' },
    { name: 'pydantic_schema_validator', scope: 'JSON Schema v2.1', status: 'ACTIVE', calls: 310, latency: '12ms' },
    { name: 'web_fetch_search', scope: 'External Web RAG', status: 'APPROVAL_REQUIRED', calls: 0, latency: 'N/A' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl slate-glass-card rounded-xl border border-slate-700 p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D97757]" />
            <h2 className="font-mono text-base font-bold text-slate-100">
              Integrations & MCP Control Center
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {mcpTools.map((t) => (
            <div key={t.name} className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-bold text-[#E2896B] flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5" /> {t.name}
                </div>
                <div className="text-slate-400 text-[11px]">Scope: {t.scope}</div>
              </div>

              <div className="text-right space-y-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {t.status}
                </span>
                <div className="text-slate-400 text-[10px]">Calls: {t.calls} ({t.latency})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
