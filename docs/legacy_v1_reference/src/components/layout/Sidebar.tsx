import React from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { NavigationScreen } from '../../types';
import {
  LayoutDashboard,
  Brain,
  Sparkles,
  Play,
  CheckCircle,
  Wrench,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Settings,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { screen: NavigationScreen; icon: any; step: string }[] = [
  { screen: 'Overview', icon: LayoutDashboard, step: '01' },
  { screen: 'Understand Request', icon: Brain, step: '02' },
  { screen: 'Optimize Request', icon: Sparkles, step: '03' },
  { screen: 'AI Execution', icon: Play, step: '04' },
  { screen: 'Check Answer', icon: CheckCircle, step: '05' },
  { screen: 'Improve Answer', icon: Wrench, step: '06' },
  { screen: 'Execution History', icon: History, step: '07' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { activeScreen, setActiveScreen, systemMode, startDemoScenario } = useTokenOS();

  const handleNavClick = (screen: NavigationScreen) => {
    setActiveScreen(screen);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between bg-bgDeep text-textPrimary select-none border-r border-borderColor">
      {/* Top Branding Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-borderColor">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-bgDeep font-extrabold text-sm shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-bgDeep" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-textPrimary tracking-tight">
                  TokenOS
                </span>
                <span className="text-[10px] text-textMuted font-mono uppercase tracking-wider">
                  AI Control Plane
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded hover:bg-surfaceElevated text-textMuted hover:text-textPrimary transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Scenario Banner */}
        {!collapsed && (
          <div className="p-3 mx-3 mt-3 bg-accentTint/40 border border-accent/30 rounded-card flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-accent font-semibold">
              <span>Demo Journey</span>
              <Zap className="w-3.5 h-3.5 fill-accent" />
            </div>
            <p className="text-[11px] text-textSecondary leading-snug">
              Turn ambiguous request into checked, improved answer.
            </p>
            <button
              onClick={startDemoScenario}
              className="w-full py-1 text-xs bg-accent text-bgDeep font-semibold rounded hover:bg-accentHover transition-colors cursor-pointer"
            >
              Launch Demo Scenario
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-2 mt-2 space-y-1">
          {NAV_ITEMS.map(({ screen, icon: Icon, step }) => {
            const isActive = activeScreen === screen;
            return (
              <button
                key={screen}
                onClick={() => handleNavClick(screen)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-xs font-medium transition-colors duration-150 cursor-pointer text-left',
                  isActive
                    ? 'bg-accentTint text-accent font-semibold border-l-2 border-l-accent'
                    : 'text-textSecondary hover:bg-surfaceElevated hover:text-textPrimary border-l-2 border-l-transparent'
                )}
                title={collapsed ? `${step}. ${screen}` : undefined}
              >
                <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-textMuted')} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{screen}</span>
                    <span className="text-[10px] font-mono text-textMuted">{step}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User & Settings Area */}
      <div className="p-3 border-t border-borderColor space-y-2">
        {!collapsed && (
          <div className="px-2 py-1.5 rounded bg-surface border border-borderColor flex items-center justify-between">
            <span className="text-[11px] text-textMuted font-mono">Engine Mode</span>
            <span
              className={clsx(
                'text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase',
                systemMode === 'demo' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
              )}
            >
              {systemMode}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-textMuted">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-surfaceElevated flex items-center justify-center text-textSecondary shrink-0 border border-borderColor">
              <User className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs text-textPrimary font-medium truncate">Demo Operator</span>
                <span className="text-[10px] text-textMuted truncate">operator@tokenos.io</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="p-1 rounded hover:bg-surfaceElevated hover:text-textPrimary transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden md:block h-screen sticky top-0 transition-all duration-200 z-30 shrink-0',
          collapsed ? 'w-[64px]' : 'w-[240px]'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-bgDeep/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="w-[240px] h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
