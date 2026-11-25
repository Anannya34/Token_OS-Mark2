import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationScreen, Run, SystemMode } from '../types';
import { INITIAL_DEMO_RUN, INITIAL_HISTORICAL_RUNS } from '../data/demoFixtures';

interface TokenOSContextType {
  activeScreen: NavigationScreen;
  setActiveScreen: (screen: NavigationScreen) => void;
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;
  activeRun: Run;
  setActiveRun: React.Dispatch<React.SetStateAction<Run>>;
  historyRuns: Run[];
  setHistoryRuns: React.Dispatch<React.SetStateAction<Run[]>>;
  startDemoScenario: () => void;
  resetDraft: () => void;
  loadRunIntoWorkspace: (runId: string) => void;
  saveCurrentRun: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const TokenOSContext = createContext<TokenOSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tokenos_runs_v1';

export const TokenOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<NavigationScreen>('Overview');
  const [systemMode, setSystemMode] = useState<SystemMode>('demo');
  const [activeRun, setActiveRun] = useState<Run>(INITIAL_DEMO_RUN);
  const [historyRuns, setHistoryRuns] = useState<Run[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial demo runs
    }
    return INITIAL_HISTORICAL_RUNS;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(historyRuns));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }, [historyRuns]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const startDemoScenario = () => {
    const demoRun: Run = JSON.parse(JSON.stringify(INITIAL_DEMO_RUN));
    demoRun.id = `run-demo-${Date.now().toString().slice(-4)}`;
    demoRun.createdAt = new Date().toISOString();
    setActiveRun(demoRun);
    setActiveScreen('Understand Request');
    showToast('Demo scenario loaded with synthetic sales numbers.');
  };

  const resetDraft = () => {
    const newRun: Run = {
      id: `run-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'idle',
      mode: systemMode,
      title: 'New Request Draft',
      originalRequest: '',
      contract: {
        objective: '',
        deliverable: '',
        audience: '',
        constraints: [],
        assumptions: [],
        ambiguities: [],
        successCriteria: [],
        outputFormat: 'Markdown',
        version: 1
      },
      prompts: [],
      activePromptId: '',
      config: {
        provider: 'Demo Provider (Simulated)',
        model: 'Demo Model Profile (Simulated)',
        contextStrategy: 'Standard',
        toolPermissions: [],
        outputFormat: 'Markdown',
        timeoutSec: 30,
        retryPolicy: 'Standard',
        reasoningEffort: 'medium',
        maxOutputTokens: 2048,
        costLimitUsd: 0.50
      },
      pipelineEvents: [],
      answers: [],
      verificationReports: [],
      usageHistory: [],
      toolCalls: [],
      iterationCount: 0,
      maxIterations: 1
    };
    setActiveRun(newRun);
    setActiveScreen('Understand Request');
  };

  const loadRunIntoWorkspace = (runId: string) => {
    const found = historyRuns.find((r) => r.id === runId);
    if (found) {
      setActiveRun(JSON.parse(JSON.stringify(found)));
      setActiveScreen('Check Answer');
      showToast(`Loaded run: ${found.title}`);
    }
  };

  const saveCurrentRun = () => {
    setHistoryRuns((prev) => {
      const idx = prev.findIndex((r) => r.id === activeRun.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = activeRun;
        return next;
      }
      return [activeRun, ...prev];
    });
    showToast('Execution history updated');
  };

  return (
    <TokenOSContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        systemMode,
        setSystemMode,
        activeRun,
        setActiveRun,
        historyRuns,
        setHistoryRuns,
        startDemoScenario,
        resetDraft,
        loadRunIntoWorkspace,
        saveCurrentRun,
        toastMessage,
        showToast
      }}
    >
      {children}
    </TokenOSContext.Provider>
  );
};

export const useTokenOS = () => {
  const context = useContext(TokenOSContext);
  if (!context) {
    throw new Error('useTokenOS must be used within a TokenOSProvider');
  }
  return context;
};
