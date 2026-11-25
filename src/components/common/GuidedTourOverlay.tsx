import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, X, Check, Eye } from 'lucide-react';
import { NavigationTab } from '../../types';

export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  targetSelector?: string;
  targetTab?: NavigationTab;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: 'Welcome to TokenOS',
    explanation: 'TokenOS optimizes AI task execution, saves tokens, and verifies results with full proof.'
  },
  {
    id: 'workbench',
    stepNumber: 2,
    title: 'Workbench',
    explanation: 'Enter any task in plain English. TokenOS prepares structured instructions and selects the best model.',
    targetSelector: '[data-tour="workbench-tab"]',
    targetTab: 'workbench'
  },
  {
    id: 'ai-review',
    stepNumber: 3,
    title: 'AI Review',
    explanation: 'Analyzes your request to identify requirements and suggest token-saving improvements.',
    targetSelector: '[data-tour="ai-review"]',
    targetTab: 'workbench'
  },
  {
    id: 'execution',
    stepNumber: 4,
    title: 'Execution Control',
    explanation: 'Track the 8-stage pipeline in real time as the AI prepares, executes, and verifies your work.',
    targetSelector: '[data-tour="execution-tab"]',
    targetTab: 'execution'
  },
  {
    id: 'quality',
    stepNumber: 5,
    title: 'Quality & Evidence',
    explanation: 'Verify each requirement against proof. Untested results are never marked verified.',
    targetSelector: '[data-tour="quality-tab"]',
    targetTab: 'quality'
  },
  {
    id: 'repair',
    stepNumber: 6,
    title: 'Repair & Refinement',
    explanation: 'Targeted fix: patches only what changed instead of wasting thousands of tokens regenerating.',
    targetSelector: '[data-tour="repair-tab"]',
    targetTab: 'repair'
  },
  {
    id: 'other-tools',
    stepNumber: 7,
    title: 'System Intelligence',
    explanation: 'ML Predictions for token trends and complete Audit & Trace logs.',
    targetSelector: '[data-tour="other-tools-tab"]'
  },
  {
    id: 'finish',
    stepNumber: 8,
    title: "You're All Set!",
    explanation: 'Start by describing your first task in the Workbench. You can replay this tour anytime via Quick Demo.',
    targetTab: 'workbench'
  }
];

interface GuidedTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const GuidedTourOverlay: React.FC<GuidedTourOverlayProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure target bounding rectangle immediately without lag
  const updateTargetRect = useCallback(() => {
    if (!currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep.targetSelector]);

  // Instant update on step change or resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      updateTargetRect();
    };

    // If step specifies a tab switch that is needed (only for Workbench specific elements)
    if (currentStep.id === 'ai-review' && onNavigateTab) {
      onNavigateTab('workbench');
    }

    // Run measurement in the next animation frame for zero-lag smooth tracking
    const frameId = requestAnimationFrame(updateTargetRect);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, currentStepIndex, currentStep.id, onNavigateTab, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  // Reset step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Smart dynamic placement of explanation card
  const cardStyle: React.CSSProperties = (() => {
    if (!targetRect) {
      // Centered for Welcome / Finish
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        maxWidth: '460px',
        width: '90%'
      };
    }

    // Left sidebar spotlight: place card to the right of the highlighted tab
    if (targetRect.left < 340) {
      const topPos = Math.min(
        Math.max(24, targetRect.top - 10),
        viewport.height - 280
      );
      return {
        top: `${topPos}px`,
        left: `${targetRect.right + 28}px`,
        position: 'fixed',
        maxWidth: '420px',
        width: '90%'
      };
    }

    // Main area spotlight (like AI Review): place card directly below
    const topPos = targetRect.bottom + 16;
    const leftPos = Math.min(
      Math.max(20, targetRect.left),
      viewport.width - 440
    );

    return {
      top: `${Math.min(topPos, viewport.height - 280)}px`,
      left: `${leftPos}px`,
      position: 'fixed',
      maxWidth: '420px',
      width: '90%'
    };
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto select-none">
      {/* 
        TRUE SPOTLIGHT HOLE:
        When targetRect exists, the cutout hole is 100% transparent so the target is
        brightly illuminated and crystal clear. The 9999px box-shadow darkens everything else!
      */}
      {targetRect ? (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '12px',
            border: '2px solid #D97757',
            boxShadow: '0 0 0 9999px rgba(7, 10, 15, 0.88), 0 0 30px rgba(217, 119, 87, 0.7), inset 0 0 15px rgba(217, 119, 87, 0.25)',
            pointerEvents: 'none',
            zIndex: 9990,
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      ) : (
        /* Full dark backdrop when no specific element is targeted */
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-[#070A0F]/90 backdrop-blur-sm transition-opacity duration-200"
          style={{ zIndex: 9990 }}
        />
      )}

      {/* Click outside to dismiss */}
      <div 
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        style={{ zIndex: 9991 }}
      />

      {/* Floating Explanation Card (React Bits inspired glass card) */}
      <div style={{ ...cardStyle, zIndex: 9999 }} className="pointer-events-auto">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0B0F17]/95 border border-[#D97757]/60 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85),_0_0_25px_rgba(217,119,87,0.15)] backdrop-blur-xl space-y-3.5 text-slate-100 font-sans"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#D97757] text-[#070A0F] font-mono font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(217,119,87,0.5)]">
                {currentStep.stepNumber}
              </span>
              <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                {currentStep.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                {currentStep.stepNumber} / {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Skip tour (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clean concise explanation */}
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {currentStep.explanation}
          </p>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center gap-1.5 py-1">
            {TOUR_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 rounded-full transition-all duration-200 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#D97757]'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-500/70'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs font-mono">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11px]"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1 rounded-lg bg-[#D97757] hover:bg-[#E2896B] text-[#070A0F] font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(217,119,87,0.4)] cursor-pointer transition-all text-[11px]"
              >
                <span>{isLast ? 'Get Started' : 'Next'}</span>
                {isLast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
