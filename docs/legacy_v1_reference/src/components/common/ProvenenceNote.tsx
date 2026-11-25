import React from 'react';
import { Info } from 'lucide-react';

interface ProvenanceNoteProps {
  text: string;
  source?: string;
  isDemo?: boolean;
}

export const ProvenanceNote: React.FC<ProvenanceNoteProps> = ({
  text,
  source,
  isDemo = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-textMuted font-mono">
      <Info className="w-3 h-3 text-info shrink-0" />
      <span>{text}</span>
      {source && (
        <span className="px-1.5 py-0.2 rounded bg-surfaceElevated text-textSecondary border border-borderColor/60">
          {source}
        </span>
      )}
      {isDemo && (
        <span className="px-1.5 py-0.2 rounded bg-warning/15 text-warning border border-warning/30 font-semibold">
          DEMO
        </span>
      )}
    </div>
  );
};
