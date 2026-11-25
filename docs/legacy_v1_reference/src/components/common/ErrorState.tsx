import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  stageName?: string;
  errorMessage: string;
  recoveryAction?: () => void;
  recoveryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Execution Failure',
  stageName,
  errorMessage,
  recoveryAction,
  recoveryLabel = 'Retry Stage',
}) => {
  return (
    <div className="surface-card p-6 border-l-4 border-l-error border-borderColor flex flex-col gap-3 bg-error/5">
      <div className="flex items-center gap-2 text-error">
        <AlertOctagon className="w-5 h-5 shrink-0" />
        <h4 className="text-sm font-semibold">{title}</h4>
        {stageName && (
          <span className="ml-auto px-2 py-0.5 text-[11px] font-mono rounded bg-error/15 text-error border border-error/30">
            Stage: {stageName}
          </span>
        )}
      </div>

      <p className="text-xs font-mono text-textPrimary bg-bgDeep p-3 rounded border border-borderColor overflow-x-auto">
        {errorMessage}
      </p>

      {recoveryAction && (
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="danger"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={recoveryAction}
          >
            {recoveryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
