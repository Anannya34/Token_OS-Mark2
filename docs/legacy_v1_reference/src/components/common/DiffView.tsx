import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DiffViewProps {
  originalLabel?: string;
  originalText: string;
  modifiedLabel?: string;
  modifiedText: string;
  changeSummary?: string;
}

export const DiffView: React.FC<DiffViewProps> = ({
  originalLabel = 'Original Version',
  originalText,
  modifiedLabel = 'Optimized Version',
  modifiedText,
  changeSummary,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {changeSummary && (
        <div className="p-3 bg-accentTint/40 border border-accent/30 rounded-card text-xs text-textPrimary flex items-center gap-2">
          <span className="font-semibold text-accent shrink-0">Summary of Changes:</span>
          <span>{changeSummary}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="surface-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-borderColor">
            <span className="text-xs font-semibold text-textSecondary">{originalLabel}</span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-bgDeep text-textMuted border border-borderColor">
              v1
            </span>
          </div>
          <pre className="text-xs font-mono text-textPrimary bg-bgDeep p-3 rounded-md border border-borderColor/60 whitespace-pre-wrap overflow-x-auto min-h-[140px]">
            {originalText || '(empty)'}
          </pre>
        </div>

        {/* Modified */}
        <div className="surface-card p-4 flex flex-col gap-2 border-accent/40 bg-accentTint/10">
          <div className="flex items-center justify-between pb-2 border-b border-borderColor">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">{modifiedLabel}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold border border-accent/40">
              v2 (Active)
            </span>
          </div>
          <pre className="text-xs font-mono text-textPrimary bg-bgDeep p-3 rounded-md border border-accent/30 whitespace-pre-wrap overflow-x-auto min-h-[140px]">
            {modifiedText || '(empty)'}
          </pre>
        </div>
      </div>
    </div>
  );
};
