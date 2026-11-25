import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={clsx('border-b border-borderColor flex items-center gap-1 overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer focus:outline-none',
              isActive
                ? 'border-accent text-accent font-semibold bg-accentTint/30'
                : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-borderColor'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 text-[10px] rounded-full font-mono',
                  isActive
                    ? 'bg-accent/20 text-accent font-semibold'
                    : 'bg-surfaceElevated text-textMuted'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
