import React from 'react';
import { PipelineStage, StageState, StageTelemetry } from '../../types';
import { 
  FileText, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Cpu, 
  BrainCircuit, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DecisionPulseProps {
  stages: StageTelemetry[];
  activeStage?: PipelineStage;
  onSelectStage?: (stage: PipelineStage) => void;
  children?: React.ReactNode;
}

const STAGE_CONFIG: { stage: PipelineStage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { stage: 'Intent', label: 'Task Requirements', icon: FileText },
  { stage: 'Policy', label: 'Policy Check', icon: ShieldCheck },
  { stage: 'Context', label: 'Context Selection', icon: Layers },
  { stage: 'Prompt', label: 'Prompt Preparation', icon: Terminal },
  { stage: 'Model', label: 'Model Selection', icon: Cpu },
  { stage: 'Reasoning', label: 'AI Execution', icon: BrainCircuit },
  { stage: 'Tools', label: 'Tool Execution', icon: Wrench },
  { stage: 'Verify', label: 'Result Verification', icon: CheckCircle2 },
];

export function formatFriendlyStageState(state?: StageState): string {
  switch (state) {
    case 'completed': return 'Completed';
    case 'active': return 'Running';
    case 'failed': return 'Failed';
    case 'skipped': return 'Skipped';
    case 'retrying': return 'Retrying';
    case 'blocked': return 'Blocked';
    case 'idle':
    default:
      return 'Waiting';
  }
}

export const DecisionPulse: React.FC<DecisionPulseProps> = ({ stages, activeStage, onSelectStage, children }) => {
  const getStageTelemetry = (stage: PipelineStage): StageTelemetry | undefined => {
    return stages.find((s) => s.stage === stage);
  };

  const getStatusColor = (state?: StageState) => {
    switch (state) {
      case 'completed':
        return 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10 shadow-[0_0_12px_rgba(34,197,94,0.3)]';
      case 'active':
        return 'border-[#D97757] text-[#D97757] bg-[#D97757]/15 animate-pulse shadow-[0_0_18px_rgba(217,119,87,0.5)]';
      case 'failed':
        return 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
      case 'retrying':
        return 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10 animate-bounce';
      case 'skipped':
        return 'border-slate-700 text-slate-500 bg-slate-900/50';
      default:
        return 'border-slate-700 text-slate-400 bg-slate-900/40';
    }
  };

  return (
    <div className="w-full slate-glass-card rounded-xl p-5 border border-slate-700/70 relative overflow-hidden my-4">
      {/* Dynamic Background Beam */}
      <div className="absolute inset-0 bg-hud-grid opacity-30 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97757] animate-ping" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#E2896B] font-semibold">
            TokenOS Pipeline Stepper — Live Activity & Usage
          </h3>
        </div>
        <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
          Live Connection: Active
        </span>
      </div>

      {/* Pipeline Stages Track */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
        {STAGE_CONFIG.map((item, index) => {
          const telemetry = getStageTelemetry(item.stage);
          const state = telemetry?.state || 'idle';
          const Icon = item.icon;
          const isSelected = activeStage === item.stage;
          const friendlyState = formatFriendlyStageState(state);

          return (
            <motion.button
              key={item.stage}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectStage && onSelectStage(item.stage)}
              className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left relative ${getStatusColor(state)} ${
                isSelected ? 'ring-2 ring-[#D97757] ring-offset-2 ring-offset-[#0B0F17]' : ''
              }`}
            >
              {/* Connector Line for Desktop */}
              {index < STAGE_CONFIG.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-[2px] bg-slate-700 z-20 pointer-events-none" />
              )}

              <div className="flex items-center justify-between w-full mb-2">
                <Icon className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold">
                  {friendlyState}
                </span>
              </div>

              <div className="font-semibold text-xs text-slate-100 mb-1 truncate w-full">
                {item.label}
              </div>

              {telemetry && (
                <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-auto pt-1 border-t border-slate-800/60 w-full">
                  <Clock className="w-2.5 h-2.5 text-[#E2896B]" />
                  <span>{telemetry.durationMs}ms</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {children && (
        <div className="relative z-10 mt-4 pt-4 border-t border-slate-800/80">
          {children}
        </div>
      )}
    </div>
  );
};
