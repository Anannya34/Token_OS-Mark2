import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="surface-card p-10 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-borderColor">
      <div className="w-12 h-12 rounded-full bg-surfaceElevated flex items-center justify-center text-textMuted mb-1">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-textPrimary">{title}</h4>
      <p className="text-xs text-textSecondary max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
