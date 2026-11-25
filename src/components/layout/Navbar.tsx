import React, { useState, useEffect, useMemo } from 'react';
import { NavigationTab } from '../../types';
import { getAllProviderModels } from '../../services/apiVaultService';
import { AuthSession } from '../../services/storageService';
import { 
  Cpu, 
  Radio, 
  Sparkles,
  Database,
  LogOut,
  ChevronRight,
  SlidersHorizontal,
  Play,
  ShieldCheck,
  Wrench,
  Zap,
  HelpCircle
} from 'lucide-react';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  onOpenModelRegistry: () => void;
  onOpenIntegrations: () => void;
  onOpenSplash?: () => void;
  onOpenAuth?: () => void;
  onOpenApiKeyVault?: () => void;
  onStartGuidedTour?: () => void;
  onSignOut?: () => void;
  authRole?: string;
  user?: AuthSession['user'] | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedProvider,
  setSelectedProvider,
  selectedModel,
  setSelectedModel,
  isDemoMode,
  setIsDemoMode,
  onOpenModelRegistry,
  onOpenIntegrations,
  onOpenSplash,
  onOpenAuth,
  onOpenApiKeyVault,
  onStartGuidedTour,
  onSignOut,
  authRole = 'SOFTWARE_ENGINEER',
  user
}) => {
  const displayName = user?.fullName?.trim() || (user?.email ? user.email.split('@')[0] : 'Operator');
  const avatarLetter = (displayName ? displayName.charAt(0) : 'U').toUpperCase();

  // Dynamic model dictionary initialized and refreshed from Vault & Custom Models
  const [providerModelsMap, setProviderModelsMap] = useState<Record<string, { value: string; label: string }[]>>(() => getAllProviderModels());

  useEffect(() => {
    const handleModelsChanged = () => {
      setProviderModelsMap(getAllProviderModels());
    };
    window.addEventListener('token_os_models_changed', handleModelsChanged);
    window.addEventListener('storage', handleModelsChanged);
    return () => {
      window.removeEventListener('token_os_models_changed', handleModelsChanged);
      window.removeEventListener('storage', handleModelsChanged);
    };
  }, []);

  const currentModels = useMemo(() => {
    if (selectedProvider === 'auto') {
      return [{ value: 'auto', label: 'Auto-Selected by Depth' }];
    }
    return providerModelsMap[selectedProvider] || providerModelsMap.gemini || [];
  }, [providerModelsMap, selectedProvider]);

  // Pipeline stepper steps
  const pipelineSteps: { id: NavigationTab; stepNum: number; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workbench', stepNum: 1, label: 'Workbench', icon: SlidersHorizontal },
    { id: 'execution', stepNum: 2, label: 'Execution', icon: Play },
    { id: 'quality', stepNum: 3, label: 'Quality & Evidence', icon: ShieldCheck },
    { id: 'repair', stepNum: 4, label: 'IPAR Repair', icon: Wrench },
  ];

  const isPipelineTab = ['workbench', 'execution', 'quality', 'repair'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-700/80">
      {/* Top Utility & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSplash}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
            title="Open Splash Screen"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97757] shadow-[0_0_8px_#D97757] group-hover:animate-ping" />
            <span className="font-bold text-[#F0F4F8] tracking-wider uppercase text-sm font-mono">
              Token<span className="text-[#D97757]">OS</span>
            </span>
          </button>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-sans hidden sm:inline">Intent-Aware AI Execution Control Plane</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Provider Selector */}
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-slate-700/80 rounded px-2.5 py-1">
            <Cpu className="w-3.5 h-3.5 text-[#E2896B]" />
            <select
              value={selectedProvider}
              onChange={(e) => {
                const newProv = e.target.value;
                setSelectedProvider(newProv);
                if (newProv === 'auto') {
                  setSelectedModel('auto');
                } else {
                  const models = providerModelsMap[newProv];
                  if (models && models.length > 0) {
                    setSelectedModel(models[0].value);
                  }
                }
              }}
              className="bg-[#0F172A] text-slate-100 text-xs focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-[#0F172A] text-slate-100 py-1">Auto-Route (Smart Token Optimizer)</option>
              <option value="gemini" className="bg-[#0F172A] text-slate-100 py-1">Google AI Studio (Gemini 1.5/2.0)</option>
              <option value="openrouter" className="bg-[#0F172A] text-slate-100 py-1">OpenRouter (200+ Models)</option>
              <option value="nvidia" className="bg-[#0F172A] text-slate-100 py-1">NVIDIA NIM Cloud API</option>
              <option value="groq" className="bg-[#0F172A] text-slate-100 py-1">Groq Cloud API (Free Llama 3.3)</option>
              <option value="ollama" className="bg-[#0F172A] text-slate-100 py-1">Ollama Local (11434)</option>
              <option value="simulated" className="bg-[#0F172A] text-slate-100 py-1">Deterministic Synthesizer</option>
            </select>
          </div>

          {/* Model Selector with Strict High Contrast Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#0F172A] border border-slate-700/80 rounded px-2.5 py-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedModel}
              onChange={(e) => {
                if (e.target.value === '__add_model__') {
                  onOpenApiKeyVault?.();
                } else {
                  setSelectedModel(e.target.value);
                }
              }}
              className="bg-[#0F172A] text-slate-100 text-xs focus:outline-none cursor-pointer max-w-[220px]"
            >
              {currentModels.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#0F172A] text-slate-100 py-1">
                  {m.label}
                </option>
              ))}
              <option value="__add_model__" className="bg-[#0F172A] text-[#E2896B] font-bold py-1">
                + Add / Configure Model...
              </option>
            </select>
          </div>

          {/* Quick Demo Button */}
          {onStartGuidedTour && (
            <button
              type="button"
              onClick={onStartGuidedTour}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D97757]/15 hover:bg-[#D97757]/25 text-[#E2896B] hover:text-[#D97757] border border-[#D97757]/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Start interactive guided tour of TokenOS"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#D97757]" />
              <span>Quick Demo</span>
            </button>
          )}

          {/* User Info (Replaces API Keys button & Exit button) */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="hover:text-[#E2896B] text-slate-200 bg-[#0F172A] border border-slate-700 hover:border-[#D97757]/60 rounded-lg px-2.5 py-1 transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
              title={`User Profile: ${displayName} (${authRole}) — Click to configure credentials & security`}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#D97757] to-amber-500 flex items-center justify-center text-black font-black text-[10px] shadow-sm shrink-0">
                {avatarLetter}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-200 font-bold group-hover:text-white max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="text-slate-600">|</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-emerald-400 font-semibold">{authRole}</span>
              </div>
            </button>
          )}

          {/* Live API / Demo Mode Indicator */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors ${
              isDemoMode 
                ? 'bg-[#D97757]/15 text-[#E2896B] border-[#D97757]/40' 
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
            }`}
          >
            {isDemoMode ? 'DEMO' : 'LIVE API'}
          </button>
        </div>
      </div>

      {/* Primary Context Header Bar: Shows Linear Pipeline Stepper OR Intelligence Screen Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto">
        {isPipelineTab ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider hidden md:inline mr-1">
              Workflow Pipeline:
            </span>
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;

              return (
                <React.Fragment key={step.id}>
                  <button
                    data-tour={`${step.id}-tab`}
                    onClick={() => setActiveTab(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#1B2436] text-[#D97757] border border-[#D97757]/50 shadow-[0_0_12px_rgba(217,119,87,0.25)] font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-[#D97757] text-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.stepNum}
                    </span>
                    <span>{step.label}</span>
                  </button>

                  {idx < pipelineSteps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Active Workspace View:</span>
              <span className="text-xs font-mono font-bold text-[#D97757]">
                {activeTab === 'ml_predictions' && 'ML & DL Predictive Intelligence Engine'}
                {activeTab === 'insights' && 'Historical Observability & Audit Traces'}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('workbench')}
              className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-[#D97757] bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <span>← Back to Pipeline</span>
            </button>
          </div>
        )}

        {/* Quick Auto-Route Optimization Indicator */}
        {selectedProvider === 'auto' && isPipelineTab && (
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Auto-Route: Saving ~72% Tokens</span>
          </div>
        )}
      </div>
    </header>
  );
};
