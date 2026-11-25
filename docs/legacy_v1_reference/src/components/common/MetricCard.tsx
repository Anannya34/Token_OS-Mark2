import React from 'react';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: {
    status: string;
    label?: string;
  };
  provenance?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  badge,
  provenance,
}) => {
  return (
    <div className="surface-card p-4 flex flex-col justify-between hover:border-textMuted transition-colors duration-150">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-textSecondary">{label}</span>
        {icon && <div className="text-textMuted shrink-0">{icon}</div>}
      </div>

      <div className="my-2">
        <div className="text-2xl font-bold font-mono text-textPrimary tracking-tight">
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-textMuted mt-1">{subtext}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-borderColor/60 text-xs text-textMuted">
        {badge ? (
          <StatusBadge status={badge.status} label={badge.label} />
        ) : (
          <span />
        )}
        {provenance && (
          <span className="text-[11px] font-mono text-textMuted truncate">
            {provenance}
          </span>
        )}
      </div>
    </div>
  );
};
