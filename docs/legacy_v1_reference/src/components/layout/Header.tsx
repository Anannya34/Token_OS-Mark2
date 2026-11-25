import React from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Menu,
  HelpCircle,
  Cpu,
  RefreshCw,
  Zap
} from 'lucide-react';
import { NavigationScreen } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const PAGE_DESCRIPTIONS: Record<NavigationScreen, string> = {
  Overview: 'System status, active execution metrics, and recent activity feed.',
  'Understand Request': 'Deconstruct natural language into an explicit, editable Intent Contract.',
  'Optimize Request': 'Refine prompt structure, enforce output schemas, and review token estimates.',
  'AI Execution': 'Configure execution policies, context budget, and run through the step-by-step pipeline.',
  'Check Answer': 'Evaluate model response against Intent Contract success criteria and findings.',
  'Improve Answer': 'Evaluate value of iteration and perform bounded, cost-aware refinements.',
  'Execution History': 'Searchable log of previous runs, prompts, contracts, and execution provenance.'
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeScreen, systemMode, setSystemMode, startDemoScenario } = useTokenOS();

  return (
    <header className="h-16 bg-surface border-b border-borderColor px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-md text-textSecondary hover:bg-surfaceElevated hover:text-textPrimary"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-textPrimary tracking-tight">
              {activeScreen}
            </h1>
            <StatusBadge
              status={systemMode === 'demo' ? 'DEMO' : 'LIVE'}
              label={systemMode === 'demo' ? 'DEMO MODE' : 'LIVE'}
            />
          </div>
          <p className="text-xs text-textSecondary hidden sm:block">
            {PAGE_DESCRIPTIONS[activeScreen]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-bgDeep border border-borderColor text-xs text-textSecondary">
          <Cpu className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-[11px]">Provider: Demo Profile</span>
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={() => setSystemMode(systemMode === 'demo' ? 'live' : 'demo')}
          className="px-2.5 py-1 text-xs rounded border border-borderColor bg-surfaceElevated hover:border-textMuted text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Toggle system environment mode"
        >
          <RefreshCw className="w-3 h-3 text-textMuted" />
          <span className="font-mono text-[11px] uppercase">{systemMode}</span>
        </button>

        {/* Demo launcher shortcut */}
        <button
          onClick={startDemoScenario}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-accent/15 text-accent border border-accent/40 rounded hover:bg-accent/25 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-accent" />
          <span>Reset Demo</span>
        </button>

        {/* Help icon */}
        <button
          className="p-1.5 rounded-md text-textMuted hover:text-textPrimary hover:bg-surfaceElevated transition-colors"
          title="TokenOS Documentation & Principles"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
