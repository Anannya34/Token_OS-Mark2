import React from 'react';
import { PipelineStage, StageStatus } from '../../types';
import {
  FileText,
  ShieldCheck,
  Paperclip,
  Cpu,
  BrainCircuit,
  Wrench,
  CheckCheck
} from 'lucide-react';
import { clsx } from 'clsx';

export interface StageInfo {
  stage: PipelineStage;
  status: StageStatus;
  detail?: string;
}

interface PipelineStepperProps {
  stages: StageInfo[];
  activeStage?: PipelineStage;
  onSelectStage?: (stage: PipelineStage) => void;
}

const STAGE_CONFIG: { stage: PipelineStage; label: string; icon: any }[] = [
  { stage: 'Intent', label: '1. Intent', icon: FileText },
  { stage: 'Policy', label: '2. Policy', icon: ShieldCheck },
  { stage: 'Context', label: '3. Context', icon: Paperclip },
  { stage: 'Model', label: '4. Model', icon: Cpu },
  { stage: 'Reasoning', label: '5. Reasoning', icon: BrainCircuit },
  { stage: 'Tools', label: '6. Tools', icon: Wrench },
  { stage: 'Verify', label: '7. Verify', icon: CheckCheck },
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  stages,
  activeStage,
  onSelectStage,
}) => {
  const getStageStatus = (stageName: PipelineStage): StageStatus => {
    const found = stages.find((s) => s.stage === stageName);
    return found ? found.status : 'pending';
  };

  return (
    <div className="w-full surface-card p-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[700px] gap-2">
        {STAGE_CONFIG.map(({ stage, label, icon: Icon }, index) => {
          const status = getStageStatus(stage);
          const isSelected = activeStage === stage;

          let statusBg = 'bg-surfaceElevated text-textMuted border-borderColor';
          if (status === 'success') {
            statusBg = 'bg-success/15 text-success border-success/40';
          } else if (status === 'warning') {
            statusBg = 'bg-warning/15 text-warning border-warning/40';
          } else if (status === 'failed') {
            statusBg = 'bg-error/15 text-error border-error/40';
          } else if (status === 'active') {
            statusBg = 'bg-accent/20 text-accent border-accent animate-pulse';
          } else if (status === 'skipped') {
            statusBg = 'bg-bgDeep text-textMuted border-borderColor opacity-60';
          }

          return (
            <React.Fragment key={stage}>
              <button
                onClick={() => onSelectStage && onSelectStage(stage)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all cursor-pointer focus:outline-none shrink-0',
                  statusBg,
                  isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-bgApp'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
              {index < STAGE_CONFIG.length - 1 && (
                <div className="h-0.5 flex-1 bg-borderColor/60 min-w-[12px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
