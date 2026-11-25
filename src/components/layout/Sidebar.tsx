import React from 'react';
import { NavigationTab } from '../../types';
import { 
  SlidersHorizontal, 
  Play, 
  ShieldCheck, 
  Wrench, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  Activity,
  Layers,
  Sparkles,
  LogOut,
  LineChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthSession } from '../../services/storageService';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  selectedProvider: string;
  selectedModel: string;
  user?: AuthSession['user'] | null;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  selectedProvider,
  selectedModel,
  user,
  onSignOut,
}) => {
  const pipelineTabs: { id: NavigationTab; label: string; subLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workbench', label: 'Workbench', subLabel: 'Prepare & Improve Prompts', icon: SlidersHorizontal },
    { id: 'execution', label: 'Execution Control', subLabel: 'Live Activity & Stepper', icon: Play },
    { id: 'quality', label: 'Quality & Evidence', subLabel: 'Result Verification', icon: ShieldCheck },
    { id: 'repair', label: 'Repair & Refinement', subLabel: 'Targeted Fix & Diff', icon: Wrench },
  ];

  const intelligenceTabs: { id: NavigationTab; label: string; subLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'ml_predictions', label: 'ML & DL Predictions', subLabel: 'Usage Trends & Insights', icon: LineChart },
    { id: 'insights', label: 'Audit & Trace Logs', subLabel: 'Execution History', icon: BarChart3 },
  ];

  const displayName = user?.fullName?.trim() || (user?.email ? user.email.split('@')[0] : 'Operator');
  const avatarLetter = (displayName ? displayName.charAt(0) : 'U').toUpperCase();

  const renderTabButton = (tab: { id: NavigationTab; label: string; subLabel: string; icon: React.FC<{ className?: string }> }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        data-tour={`${tab.id}-tab`}
        onClick={() => setActiveTab(tab.id)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all relative group cursor-pointer ${
          isActive 
            ? 'bg-slate-850 text-slate-100 border border-[#D97757]/50 shadow-[0_0_18px_rgba(217,119,87,0.18)]' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="activeSidebarIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D97757] rounded-r-full shadow-[0_0_10px_#D97757]"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D97757]' : 'text-slate-400 group-hover:text-slate-200'}`} />

        {!isCollapsed && (
          <div className="text-left font-mono overflow-hidden">
            <div className={`text-xs font-semibold truncate ${isActive ? 'text-[#D97757]' : 'text-slate-200'}`}>
              {tab.label}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{tab.subLabel}</div>
          </div>
        )}
      </button>
    );
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '72px' : '270px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-[#0B0F17]/95 backdrop-blur-xl border-r border-slate-700/80 z-30 select-none overflow-hidden"
    >
      {/* Sidebar Header & Toggle */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-800">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97757] shadow-[0_0_10px_#D97757] animate-pulse" />
            <span className="font-mono font-bold text-slate-100 text-base tracking-wider">
              TOKEN<span className="text-[#D97757]">OS</span>
            </span>
          </motion.div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-[#E2896B] hover:border-[#D97757]/60 transition-colors mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#E2896B]" /> : <ChevronLeft className="w-4 h-4 text-[#E2896B]" />}
        </button>
      </div>

      {/* Navigation List Organized by Category */}
      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Section 1: Pipeline */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Execution Pipeline
            </div>
          )}
          {pipelineTabs.map(renderTabButton)}
        </div>

        {/* Section 2: Deep Intelligence & Tools */}
        <div data-tour="other-tools-tab" className="space-y-1 pt-2 border-t border-slate-800/60">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Intelligence & Hubs
            </div>
          )}
          {intelligenceTabs.map(renderTabButton)}
        </div>
      </div>

      {/* Quick Status Subpanel */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-t border-slate-800 space-y-1 font-mono text-xs bg-slate-950/40">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#E2896B]" /> Provider:
            </span>
            <span className="text-slate-200 font-bold capitalize truncate max-w-[120px]">{selectedProvider}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Token Efficiency:
            </span>
            <span className="text-emerald-400 font-bold">+68.4%</span>
          </div>
        </div>
      )}

      {/* Logged-In User Profile at Bottom of Sidebar */}
      <div className="border-t border-slate-800 bg-[#0A0E17] p-2.5">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D97757] via-[#E2896B] to-amber-300 p-[1px] shadow-[0_0_10px_rgba(217,119,87,0.3)]">
                  <div className="w-full h-full bg-[#0B0F17] rounded-[7px] flex items-center justify-center font-mono font-bold text-xs text-[#E2896B]">
                    {avatarLetter}
                  </div>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-950 ${
                  user?.mode === 'supabase_cloud' ? 'bg-emerald-400 animate-pulse' : 'bg-[#D97757]'
                }`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs font-bold text-slate-200 truncate">
                  {displayName}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">
                  {user?.email || 'authenticated'}
                </div>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-lg bg-[#D97757]/20 border border-[#D97757]/40 flex items-center justify-center text-[11px] font-mono font-bold text-[#E2896B]">
              {avatarLetter}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
