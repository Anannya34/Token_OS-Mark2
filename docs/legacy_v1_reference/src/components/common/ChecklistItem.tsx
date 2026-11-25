import React from 'react';
import { StatusBadge } from './StatusBadge';
import { FindingStatus, CheckSeverity, CheckType } from '../../types';

interface ChecklistItemProps {
  code: string;
  text: string;
  status: FindingStatus;
  severity?: CheckSeverity;
  checkType?: CheckType;
  detail?: string;
  evidenceExcerpt?: string;
  onAccept?: () => void;
  accepted?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  code,
  text,
  status,
  severity,
  checkType,
  detail,
  evidenceExcerpt,
  onAccept,
  accepted,
}) => {
  return (
    <div className="surface-card p-4 flex flex-col gap-2.5 border-l-4 border-l-transparent hover:border-borderColor transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-bgDeep border border-borderColor text-textPrimary text-xs font-mono font-semibold flex items-center justify-center shrink-0">
            {code}
          </span>
          <span className="text-xs font-semibold text-textPrimary">{text}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {checkType && (
            <span
              className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                checkType === 'Deterministic check'
                  ? 'bg-info/10 text-info border-info/30'
                  : 'bg-accent/10 text-accent border-accent/30'
              }`}
            >
              {checkType}
            </span>
          )}
          {severity && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-mono uppercase rounded ${
                severity === 'high'
                  ? 'bg-error/20 text-error font-bold'
                  : severity === 'medium'
                  ? 'bg-warning/20 text-warning font-semibold'
                  : 'bg-borderColor/40 text-textMuted'
              }`}
            >
              {severity}
            </span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      {detail && (
        <p className="text-xs text-textSecondary bg-bgDeep p-2.5 rounded border border-borderColor/60">
          {detail}
        </p>
      )}

      {evidenceExcerpt && (
        <div className="text-[11px] text-textMuted bg-surfaceElevated/50 p-2 rounded border border-borderColor/40 italic">
          <span className="font-semibold not-italic text-textSecondary">Excerpt: </span>
          "{evidenceExcerpt}"
        </div>
      )}

      {onAccept && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onAccept}
            className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              accepted
                ? 'bg-success/20 text-success border-success/40 font-medium'
                : 'bg-surfaceElevated text-textSecondary hover:text-textPrimary border-borderColor'
            }`}
          >
            {accepted ? 'Finding Accepted' : 'Mark Accepted'}
          </button>
        </div>
      )}
    </div>
  );
};
