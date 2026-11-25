import React from 'react';

interface PerformanceMeterProps {
  value: number; // 0 to 100
  maxBlocks?: number;
  label?: string;
  unit?: string;
  variant?: 'standard' | 'positive' | 'cost';
}

export const PerformanceMeter: React.FC<PerformanceMeterProps> = ({
  value,
  maxBlocks = 14,
  label,
  unit = '%',
  variant = 'standard'
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
  const activeBlocks = Math.round((clampedValue / 100) * maxBlocks);

  const getBlockColor = (index: number) => {
    if (variant === 'positive') {
      // High score is optimal: terracotta graduating to vibrant emerald
      if (index >= maxBlocks * 0.70) {
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
      }
      return 'bg-[#D97757] shadow-[0_0_8px_rgba(217,119,87,0.4)]';
    }

    if (variant === 'cost') {
      // High cost allocation consumes budget: green -> amber -> red
      if (index >= maxBlocks * 0.75) {
        return 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]';
      }
      if (index >= maxBlocks * 0.5) {
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
      }
      return 'bg-[#D97757] shadow-[0_0_8px_rgba(217,119,87,0.4)]';
    }

    // Standard rev-counter
    const isHigh = index >= maxBlocks * 0.75;
    return isHigh
      ? 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]'
      : 'bg-[#D97757] shadow-[0_0_8px_#D97757]';
  };

  return (
    <div className="space-y-1 font-mono text-xs">
      {label && (
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>{label}</span>
          <span className={`font-bold transition-colors duration-300 ${
            variant === 'positive' && clampedValue >= 80 ? 'text-emerald-400' :
            variant === 'cost' && clampedValue >= 75 ? 'text-red-400' :
            'text-[#E2896B]'
          }`}>
            {clampedValue}{unit}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded border border-slate-800">
        {Array.from({ length: maxBlocks }).map((_, i) => {
          const isActive = i < activeBlocks;

          return (
            <div
              key={i}
              className={`flex-1 h-3.5 rounded-sm transition-all duration-300 ${
                isActive
                  ? getBlockColor(i)
                  : 'bg-slate-900 border border-slate-800/80'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
