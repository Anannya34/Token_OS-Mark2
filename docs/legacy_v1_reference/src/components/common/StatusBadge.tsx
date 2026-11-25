import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Zap,
  Radio,
  Calculator,
  ServerOff,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'DEMO'
  | 'LIVE'
  | 'Estimated'
  | 'Provider-reported'
  | 'Unavailable'
  | 'met'
  | 'partial'
  | 'not_met'
  | 'not_evaluated'
  | 'passed'
  | 'failed'
  | 'needs_review';

interface StatusBadgeProps {
  status: BadgeVariant | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  let badgeStyle = 'bg-surfaceElevated text-textSecondary border-borderColor';
  let Icon = HelpCircle;
  let text = label || status;

  switch (status) {
    case 'DEMO':
      badgeStyle = 'bg-warning/15 text-warning border-warning/40 font-mono';
      Icon = Zap;
      text = label || 'DEMO MODE';
      break;
    case 'LIVE':
      badgeStyle = 'bg-success/15 text-success border-success/40 font-mono';
      Icon = Radio;
      text = label || 'LIVE';
      break;
    case 'Estimated':
      badgeStyle = 'bg-info/15 text-info border-info/40 font-mono';
      Icon = Calculator;
      text = label || 'Estimated';
      break;
    case 'Provider-reported':
      badgeStyle = 'bg-accent/15 text-accent border-accent/40 font-mono';
      Icon = Database;
      text = label || 'Provider-reported';
      break;
    case 'Unavailable':
      badgeStyle = 'bg-borderColor/30 text-textMuted border-borderColor';
      Icon = ServerOff;
      text = label || 'Unavailable';
      break;
    case 'met':
    case 'passed':
    case 'completed':
    case 'success':
      badgeStyle = 'bg-success/15 text-success border-success/40';
      Icon = CheckCircle2;
      text = label || (status === 'met' ? 'Met' : status === 'passed' ? 'Passed' : 'Success');
      break;
    case 'partial':
    case 'warning':
    case 'needs_review':
      badgeStyle = 'bg-warning/15 text-warning border-warning/40';
      Icon = AlertTriangle;
      text = label || (status === 'partial' ? 'Partial' : status === 'needs_review' ? 'Needs Review' : 'Warning');
      break;
    case 'not_met':
    case 'failed':
    case 'error':
      badgeStyle = 'bg-error/15 text-error border-error/40';
      Icon = XCircle;
      text = label || (status === 'not_met' ? 'Not Met' : status === 'failed' ? 'Failed' : 'Error');
      break;
    case 'not_evaluated':
    case 'idle':
    case 'pending':
      badgeStyle = 'bg-surfaceElevated text-textMuted border-borderColor';
      Icon = HelpCircle;
      text = label || 'Not Evaluated';
      break;
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border leading-tight select-none',
          badgeStyle,
          className
        )
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
};
