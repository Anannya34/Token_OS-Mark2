import React, { useState, useMemo, useEffect } from 'react';
import { IntentContract, TaskType, PromptLaboratory, ExecutionRun } from '../../types';
import { INITIAL_PROMPT_LAB } from '../../services/mockData';
import { getAllProviderModels } from '../../services/apiVaultService';
import { PerformanceMeter } from '../common/PerformanceMeter';
import { TextScramble } from '../common/TextScramble';
import { countTokens, pruneContextDeterministic } from '../../services/astPruner';
import {
  Sliders,
  Terminal,
  ShieldCheck,
  Lock,
  Unlock,
  Play,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  Zap,
  Gauge,
  Wand2,
  TrendingDown,
  Cpu,
  Coins,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Key,
  Copy,
  Columns,
  Clock,
  DollarSign,
  FileText,
  Settings2,
  CheckSquare,
  AlertCircle,
  Edit3,
  RotateCcw,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  deconstructPromptToContract,
  analyzePromptAndAutoRoute,
  calculateAutonomousConstraints
} from '../../services/aiEngine';
import { 
  performAIReview, 
  ExecutionDepth, 
  PromptFormat, 
  AIReviewResult 
} from '../../services/aiReviewService';
import { AuthSession } from '../../services/storageService';

interface WorkbenchScreenProps {
  contract: IntentContract;
  setContract: React.Dispatch<React.SetStateAction<IntentContract>>;
  onRunExecution: () => void;
  selectedProvider?: string;
  setSelectedProvider?: (provider: string) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  onApplyRecommendedModel?: (model: string, provider: string) => void;
  onOpenApiKeyVault?: () => void;
  authSession?: AuthSession;
  runsHistory?: ExecutionRun[];
  onResetAll?: () => void;
}

export const WorkbenchScreen: React.FC<WorkbenchScreenProps> = ({
  contract,
  setContract,
  onRunExecution,
  selectedProvider = 'auto',
  setSelectedProvider,
  selectedModel = 'auto',
  setSelectedModel,
  onApplyRecommendedModel,
  onOpenApiKeyVault,
  authSession,
  runsHistory = [],
  onResetAll
}) => {
  // Model routing mode: 'auto' (Intelligent token optimizer) vs 'manual' (User explicit selection)
  const [routingMode, setRoutingMode] = useState<'auto' | 'manual'>(selectedProvider === 'auto' || !selectedProvider ? 'auto' : 'manual');

  useEffect(() => {
    setRoutingMode(selectedProvider === 'auto' ? 'auto' : 'manual');
  }, [selectedProvider]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // New Controls: AI Review, Require Approval, Execution Depth, Prompt Format
  const [isAiReviewEnabled, setIsAiReviewEnabled] = useState<boolean>(true);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);
  const [executionDepth, setExecutionDepth] = useState<ExecutionDepth>('MEDIUM');
  const [selectedFormat, setSelectedFormat] = useState<PromptFormat>('Structured Instructions');
  const [isManualFormat, setIsManualFormat] = useState<boolean>(false);
  const [customTemplateText, setCustomTemplateText] = useState<string>(() => {
    try {
      return localStorage.getItem('token_os_custom_template') || 'Task: {{task}}\nConstraints: {{requirements}}\nOutput: Concise, complete, zero fluff.';
    } catch {
      return 'Task: {{task}}\nConstraints: {{requirements}}\nOutput: Concise, complete, zero fluff.';
    }
  });
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [isEditingImprovedPrompt, setIsEditingImprovedPrompt] = useState<boolean>(false);
  const [customImprovedPromptText, setCustomImprovedPromptText] = useState<string>('');

  // Initialize prompt laboratory with dynamic synthesis if contract has a custom objective
  const [promptLab, setPromptLab] = useState<PromptLaboratory>(() => {
    if (contract.objective && contract.objective !== INITIAL_PROMPT_LAB.originalPrompt) {
      return deconstructPromptToContract(contract.objective, contract).promptLab;
    }
    return INITIAL_PROMPT_LAB;
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [activePromptTab, setActivePromptTab] = useState<'structured' | 'original' | 'astPruned'>('structured');
  const [promptLabViewMode, setPromptLabViewMode] = useState<'split' | 'tabs'>('split');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const rawPromptText = (contract.objective || '').trim();

  // Perform live AI Review
  const aiReviewResult: AIReviewResult = useMemo(() => {
    return performAIReview(rawPromptText, contract.taskType, executionDepth, isManualFormat ? selectedFormat : undefined, customTemplateText);
  }, [rawPromptText, contract.taskType, executionDepth, isManualFormat, selectedFormat, customTemplateText]);

  // Keep format synced when AI Review recommends it and user hasn't manually chosen one
  useEffect(() => {
    if (isAiReviewEnabled && !isManualFormat && aiReviewResult.recommendedFormat.format) {
      setSelectedFormat(aiReviewResult.recommendedFormat.format);
    }
  }, [isAiReviewEnabled, isManualFormat, aiReviewResult.recommendedFormat.format]);

  // The active improved prompt text (custom edit or generated)
  const effectiveImprovedPrompt = useMemo(() => {
    if (!isAiReviewEnabled) return rawPromptText;
    if (customImprovedPromptText.trim()) return customImprovedPromptText;
    return aiReviewResult.improvedPrompt;
  }, [isAiReviewEnabled, rawPromptText, customImprovedPromptText, aiReviewResult.improvedPrompt]);

  const structuredPromptText = isAiReviewEnabled ? effectiveImprovedPrompt : rawPromptText;

  // Deterministic live AST pruning of structured context (Removing unnecessary information)
  const astPrunedResult = useMemo(() => {
    return pruneContextDeterministic(structuredPromptText || rawPromptText, contract.taskType);
  }, [structuredPromptText, rawPromptText, contract.taskType]);

  const handleCopyBestPrompt = () => {
    const textToCopy = isAiReviewEnabled ? effectiveImprovedPrompt : (astPrunedResult.pruned || rawPromptText);
    if (!textToCopy) return;
    try {
      navigator.clipboard?.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch { }
  };

  // Constraint calibration mode: 'auto' (AI autonomous adaptation) vs 'manual' (User explicit override)
  const [isAutoConstraintMode, setIsAutoConstraintMode] = useState<boolean>(true);

  // Effective provider & model (resolve 'auto' to the routed recommendation)
  const autoRoute = useMemo(() => {
    return analyzePromptAndAutoRoute(rawPromptText || '', undefined, executionDepth);
  }, [rawPromptText, executionDepth]);

  const effectiveProvider = selectedProvider === 'auto' ? autoRoute.recommendedProvider : selectedProvider;
  const effectiveModel = selectedModel === 'auto' || selectedProvider === 'auto' ? autoRoute.recommendedModel : selectedModel;

  // Compute live autonomous hard constraints based on model chosen and workload understanding
  const autoConstraints = useMemo(() => {
    return calculateAutonomousConstraints({
      prompt: contract.objective || '',
      provider: effectiveProvider,
      model: effectiveModel,
      depth: executionDepth
    });
  }, [contract.objective, effectiveProvider, effectiveModel, executionDepth]);

  // Verified Model Rate Card & Observed Latency Lookup
  const getVerifiedModelRateCard = (prov: string, mod: string) => {
    const p = (prov || '').toLowerCase();
    const m = (mod || '').toLowerCase();
    if (p === 'ollama' || m.includes('ollama')) {
      return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: Infinity, unit: 'Unlimited Local', docLatencyMs: 650, label: 'Local ($0.00)' };
    }
    if (p === 'gemini' || p === 'google') {
      if (m.includes('pro')) {
        return { inputRate: 1.25, outputRate: 5.00, isFree: false, dailyLimit: 50, unit: '50 RPD Free / $1.25-$5.00 per 1M', docLatencyMs: 1100, label: 'Gemini Pro ($1.25/$5.00 per 1M)' };
      }
      return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 1500, unit: '1,500 RPD • 1M TPM Free Tier', docLatencyMs: 420, label: 'Gemini Free Tier ($0.00)' };
    }
    if (p === 'groq') {
      if (m.includes('8b')) {
        return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 14400, unit: '14,400 RPD • 6K TPM Free Tier', docLatencyMs: 180, label: 'Groq Free Tier (8B Instant)' };
      }
      if (m.includes('gpt-oss-120b')) {
        return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 1000, unit: '1,000 RPD • 8K TPM Free Tier', docLatencyMs: 450, label: 'Groq Free Tier (120B)' };
      }
      return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 1000, unit: '1,000 RPD • 12K TPM Free Tier', docLatencyMs: 320, label: 'Groq Free Tier (70B)' };
    }
    if (p === 'openrouter') {
      if (m.includes(':free')) {
        return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 200, unit: '200 RPD • 20 RPM Free Tier', docLatencyMs: 750, label: 'OpenRouter :free ($0.00)' };
      }
      return { inputRate: 0.55, outputRate: 2.19, isFree: false, dailyLimit: Infinity, unit: 'Pay-as-you-go ($0.55/$2.19 per 1M)', docLatencyMs: 1200, label: 'OpenRouter Paid ($0.55/$2.19)' };
    }
    if (p === 'nvidia') {
      return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: 1000, unit: '1,000 Sandbox Credits', docLatencyMs: 600, label: 'NVIDIA NIM Credits' };
    }
    return { inputRate: 0, outputRate: 0, isFree: true, dailyLimit: Infinity, unit: 'Offline Synthesizer', docLatencyMs: 150, label: 'Offline ($0.00)' };
  };

  // Real usage & remaining quota computed from runsHistory (excluding run-tk-ready placeholder)
  const providerUsageStats = useMemo(() => {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const realRuns = runsHistory.filter(r => r.id !== 'run-tk-ready');
    const matchingProvRuns = realRuns.filter(r =>
      r.providerModel.toLowerCase().includes(effectiveProvider.toLowerCase()) ||
      r.actualServingModel?.toLowerCase() === effectiveModel.toLowerCase()
    );
    const todayRuns = matchingProvRuns.filter(r => (r.timestamp || '').startsWith(todayPrefix));
    const tokensUsedToday = todayRuns.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const latencies = matchingProvRuns.map(r => r.totalLatencyMs).filter(l => l > 0);
    const observedAvgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    const rateCard = getVerifiedModelRateCard(effectiveProvider, effectiveModel);
    const remainingRpd = rateCard.dailyLimit === Infinity
      ? 'Unlimited'
      : `${Math.max(0, rateCard.dailyLimit - todayRuns.length).toLocaleString()} / ${rateCard.dailyLimit.toLocaleString()} RPD left`;

    return {
      runsToday: todayRuns.length,
      tokensUsedToday,
      remainingRpd,
      observedAvgLatencyMs,
      rateCard
    };
  }, [runsHistory, effectiveProvider, effectiveModel]);

  // Dual-Plane Prompt Improvement Metrics (100% Real BPE + Documented Rate Cards)
  const promptLabMetrics = useMemo(() => {
    const origTokens = countTokens(rawPromptText);
    const structuredTokens = rawPromptText ? countTokens(effectiveImprovedPrompt) : 0;
    const astPrunedTokens = rawPromptText ? astPrunedResult.prunedTokens : 0;

    // Proportional output estimate based on actual input tokens + depth + task type
    let projectedOutputTokens = 0;
    if (origTokens > 0) {
      const baseMult = executionDepth === 'HIGH' ? 6 : executionDepth === 'LOW' ? 2.5 : 4;
      const minFloor = executionDepth === 'HIGH' ? 280 : executionDepth === 'LOW' ? 60 : 140;
      const maxCap = executionDepth === 'HIGH' ? 1800 : executionDepth === 'LOW' ? 400 : 850;
      projectedOutputTokens = Math.min(maxCap, Math.max(minFloor, Math.round(origTokens * baseMult)));
    }

    const totalEstimatedTokens = astPrunedTokens + projectedOutputTokens;

    // Real token savings %: combine fluff stripped + AST pruning (0% if empty or none stripped)
    const fluffSaved = aiReviewResult.tokenMetrics.savedTokens;
    const astSaved = Math.max(0, structuredTokens - astPrunedTokens);
    const totalSaved = fluffSaved + astSaved;
    const tokenSavingsPct = origTokens > 0
      ? Math.min(85, Math.round((totalSaved / (origTokens + fluffSaved)) * 100))
      : 0;

    const { rateCard, observedAvgLatencyMs } = providerUsageStats;
    const calculatedCost = origTokens > 0
      ? (astPrunedTokens * rateCard.inputRate / 1000000) + (projectedOutputTokens * rateCard.outputRate / 1000000)
      : 0;

    const baselineCost = origTokens > 0
      ? (origTokens * 2.50 / 1000000) + (projectedOutputTokens * 10.00 / 1000000)
      : 0;
    const savingsVsBaseline = Math.max(0, baselineCost - calculatedCost);

    const slaLatencyMs = autoConstraints.maxLatencyMs || 3500;
    const currentP50 = observedAvgLatencyMs ?? rateCard.docLatencyMs;

    return {
      origTokens,
      structuredTokens,
      projectedOutputTokens,
      totalEstimatedTokens,
      tokenSavingsPct,
      inputRate: rateCard.inputRate,
      outputRate: rateCard.outputRate,
      costProofLabel: rateCard.label,
      calculatedCost,
      baselineCost,
      savingsVsBaseline,
      localPowerNote: effectiveProvider === 'ollama' ? 'Local hardware compute ($0.00 API)' : '',
      slaLatencyMs,
      currentP50,
      isObservedLatency: observedAvgLatencyMs !== null
    };
  }, [rawPromptText, effectiveImprovedPrompt, astPrunedResult, executionDepth, aiReviewResult.tokenMetrics.savedTokens, providerUsageStats, autoConstraints.maxLatencyMs, effectiveProvider]);

  // Synchronize contract hard constraints with autonomous calculation whenever in auto mode
  useEffect(() => {
    if (isAutoConstraintMode) {
      setContract(prev => {
        if (
          prev.hardConstraints.maxTokens === autoConstraints.maxTokens &&
          prev.hardConstraints.maxLatencyMs === autoConstraints.maxLatencyMs &&
          prev.hardConstraints.maxCostUsd === autoConstraints.maxCostUsd &&
          prev.hardConstraints.localOnly === autoConstraints.localOnly
        ) {
          return prev;
        }
        return {
          ...prev,
          hardConstraints: {
            ...prev.hardConstraints,
            maxTokens: autoConstraints.maxTokens,
            maxLatencyMs: autoConstraints.maxLatencyMs,
            maxCostUsd: autoConstraints.maxCostUsd,
            localOnly: autoConstraints.localOnly,
            maxRetries: autoConstraints.maxRetries
          }
        };
      });
    }
  }, [isAutoConstraintMode, autoConstraints, setContract]);

  // Performance meters: Genuine real-time Pre-Execution Validation Checks (0% when empty)
  const contextCompressionRatio = useMemo(() => {
    if (!rawPromptText) return 0;
    return promptLabMetrics.tokenSavingsPct;
  }, [rawPromptText, promptLabMetrics.tokenSavingsPct]);

  const estimatedCostAllocation = useMemo(() => {
    if (!rawPromptText) return 0;
    const estTokens = promptLabMetrics.totalEstimatedTokens;
    const maxTokens = (isAutoConstraintMode ? autoConstraints.maxTokens : contract.hardConstraints.maxTokens) || 3072;
    return Math.min(100, Math.max(1, Math.round((estTokens / maxTokens) * 100)));
  }, [rawPromptText, promptLabMetrics.totalEstimatedTokens, isAutoConstraintMode, autoConstraints.maxTokens, contract.hardConstraints.maxTokens]);

  const resultVerificationReadiness = useMemo(() => {
    if (!rawPromptText) return 0;
    let score = 40; // Base for non-empty prompt
    const words = rawPromptText.split(/\s+/).filter(Boolean).length;
    if (words >= 5) score += 15;
    if ((contract.requirements?.length || 0) > 0) score += 25;
    if (isAiReviewEnabled) score += 10;
    if (effectiveModel && effectiveProvider) score += 10;
    return Math.min(100, score);
  }, [rawPromptText, contract.requirements, isAiReviewEnabled, effectiveModel, effectiveProvider]);

  const handleResetTask = () => {
    setIsAiReviewEnabled(true);
    setRequireApproval(false);
    setExecutionDepth('MEDIUM');
    setIsManualFormat(false);
    setSelectedFormat('Code-oriented');
    setIsEditingImprovedPrompt(false);
    setCustomImprovedPromptText('');
    setNewRequirement('');
    setIsAutoConstraintMode(true);
    setRoutingMode('auto');
    setPromptLab(INITIAL_PROMPT_LAB);

    if (onResetAll) {
      onResetAll();
    } else {
      setContract({
        ...contract,
        id: `contract-tk-${Math.floor(1000 + Math.random() * 9000)}`,
        title: '',
        taskType: 'coding',
        objective: '',
        requirements: [],
        createdAt: new Date().toISOString()
      });
      setSelectedProvider?.('auto');
      setSelectedModel?.('auto');
    }

    setFeedbackNotice('✓ Everything reset. Ready for a fresh task.');
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  // Dynamic model dictionary initialized and refreshed from Vault & Custom Models
  const [providerModelsMap, setProviderModelsMap] = useState<Record<string, { value: string; label: string }[]>>(() => getAllProviderModels());

  useEffect(() => {
    const handleModelsChanged = () => {
      setProviderModelsMap(getAllProviderModels());
    };
    window.addEventListener('token_os_models_changed', handleModelsChanged);
    window.addEventListener('storage', handleModelsChanged);
    return () => {
      window.removeEventListener('token_os_models_changed', handleModelsChanged);
      window.removeEventListener('storage', handleModelsChanged);
    };
  }, []);

  const activeProviderModels = useMemo(() => {
    const list = providerModelsMap[selectedProvider] || providerModelsMap.gemini || [];
    if (selectedModel && !list.some(m => m.value === selectedModel)) {
      return [{ value: selectedModel, label: `${selectedModel} (Configured)` }, ...list];
    }
    return list;
  }, [providerModelsMap, selectedProvider, selectedModel]);

  const getProviderQuotaInfo = (provider: string) => {
    switch (provider) {
      case 'gemini':
      case 'google':
        return {
          tier: 'Google AI Studio (Gemini)',
          rateLimit: '15 RPM / 1M TPM / 1,500 RPD',
          costTier: 'Free Tier Active ($0.00)',
          statusLabel: 'Sovereign Free Tier'
        };
      case 'openrouter':
        return {
          tier: 'OpenRouter Unified Gateway',
          rateLimit: '200+ Frontier Models',
          costTier: 'Zero-Cost Free Tier (:free)',
          statusLabel: 'Multi-Model Free & Paid'
        };
      case 'groq':
        return {
          tier: 'Groq Cloud LPUs',
          rateLimit: '30 RPM / 14,400 RPD',
          costTier: 'Free Tier Active (<400ms)',
          statusLabel: 'Ultra-Fast Free Tier'
        };
      case 'nvidia':
        return {
          tier: 'NVIDIA NIM Enterprise',
          rateLimit: '1000 Credits Sandbox',
          costTier: 'Developer Cloud Access',
          statusLabel: 'GPU Accelerated'
        };
      case 'ollama':
      default:
        return {
          tier: 'Local Ollama Instance',
          rateLimit: 'Infinite / Hardware Bound',
          costTier: 'Zero Cloud Token Cost ($0.00)',
          statusLabel: '100% Offline Sovereign'
        };
    }
  };

  const activeQuota = getProviderQuotaInfo(selectedProvider);

  // Detect language domain
  const detectedLang = useMemo(() => {
    const text = contract.objective.toLowerCase();
    if (text.includes('python') || text.includes('fastapi') || text.includes('pytest') || text.includes('.py')) return 'Python';
    if (text.includes('go') || text.includes('golang') || text.includes('goroutine') || text.includes('.go')) return 'Go';
    if (text.includes('rust') || text.includes('cargo') || text.includes('tokio') || text.includes('.rs')) return 'Rust';
    if (text.includes('typescript') || text.includes('node') || text.includes('react') || text.includes('ts') || text.includes('js')) return 'TypeScript';
    if (text.includes('sql') || text.includes('postgres') || text.includes('query')) return 'PostgreSQL';
    return 'General / Multi-domain';
  }, [contract.objective]);

  // Primary Action: Auto-Analyze prompt, synthesize requirements, and auto-route model
  const handleStartAndConfigureIntent = (overridePrompt?: string) => {
    const promptText = (overridePrompt !== undefined ? overridePrompt : contract.objective).trim();
    if (!promptText) return;

    const { contract: updatedContract, promptLab: updatedLab } = deconstructPromptToContract(promptText, contract);
    setContract(updatedContract);
    setPromptLab(updatedLab);

    const route = analyzePromptAndAutoRoute(promptText, undefined, executionDepth);

    if (routingMode === 'auto') {
      onApplyRecommendedModel?.(route.recommendedModel, route.recommendedProvider);
      setSelectedProvider?.(route.recommendedProvider);
      setSelectedModel?.(route.recommendedModel);
    }

    setFeedbackNotice(`✓ Task Analyzed: "${updatedContract.title}". Ready for execution.`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Execution Trigger with Approval Intercept
  const handleInitiateExecution = () => {
    if (requireApproval) {
      setIsApprovalModalOpen(true);
    } else {
      onRunExecution();
    }
  };

  const handleApproveAndExecute = () => {
    setIsApprovalModalOpen(false);
    onRunExecution();
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    setContract((prev) => ({
      ...prev,
      requirements: [...prev.requirements, newRequirement.trim()],
    }));
    setNewRequirement('');
  };

  const handleRemoveRequirement = (index: number) => {
    setContract((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleHardConstraintChange = (field: string, value: any) => {
    setContract((prev) => ({
      ...prev,
      hardConstraints: {
        ...prev.hardConstraints,
        [field]: value,
      },
    }));
  };

  const PROMPT_FORMATS: PromptFormat[] = [
    'Natural Language',
    'Structured Instructions',
    'JSON',
    'XML',
    'Code-oriented',
    'Custom Template'
  ];

  return (
    <div className="space-y-6" data-tour="workbench">
      {/* Screen Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 slate-glass-card p-5 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-[#D97757]" />
            <h1 className="text-xl font-bold text-[#F0F4F8] font-mono">
              Workbench — <TextScramble text="Describe what you want the AI to do" scrambleSpeed={30} />
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Enter your request in plain English. TokenOS prepares clear instructions, chooses the right model, and enforces your time and cost limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenApiKeyVault && (
            <button
              onClick={onOpenApiKeyVault}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-[#E2896B] font-mono text-xs px-3.5 py-3 rounded-xl border border-[#D97757]/40 cursor-pointer transition-colors shadow-sm"
              title="Open Secure API Key Vault to add, view, or delete LLM keys"
            >
              <Key className="w-3.5 h-3.5 text-[#D97757]" />
              <span>API Key Vault</span>
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleInitiateExecution}
            className="flex items-center gap-2.5 bg-[#D97757] hover:bg-[#E2896B] text-black font-mono font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(217,119,87,0.4)] transition-all cursor-pointer text-xs tracking-wide uppercase"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{requireApproval ? 'REVIEW & RUN' : 'COMPILE & EXECUTE'}</span>
            <Zap className="w-4 h-4 fill-black text-black" />
          </motion.button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-950/80 border border-emerald-700/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Configured</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Input, Controls & Requirements */}
        <div className="lg:col-span-7 space-y-6">
          <div className="slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
            
            {/* Header: Task Requirements */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="font-mono text-sm font-semibold text-[#E2896B] flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Task Requirements & Controls
                </h2>
                <button
                  type="button"
                  onClick={handleResetTask}
                  className="flex items-center gap-1 text-[10.5px] font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="Clear prompt and start a fresh task"
                >
                  <RotateCcw className="w-3 h-3 text-[#E2896B]" />
                  <span>Reset</span>
                </button>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                Task ID: {contract.id}
              </span>
            </div>

            {/* CONTROLS ROW: AI Review Toggle, Require Approval Toggle, Execution Depth */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800">
              {/* Control A: AI Review */}
              <div data-tour="ai-review" className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#E2896B]" /> AI Review
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAiReviewEnabled(!isAiReviewEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isAiReviewEnabled ? 'bg-[#D97757]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        isAiReviewEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  {isAiReviewEnabled ? 'Analyses task, clarifies goals & suggests improvements.' : 'Preserves your prompt exactly without modification.'}
                </p>
              </div>

              {/* Control B: Require My Approval (Checkbox Gate — visually distinct from AI Review toggle) */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setRequireApproval(!requireApproval)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                    requireApproval
                      ? 'bg-blue-950/40 border-blue-500/60 text-blue-100'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded flex items-center justify-center border ${
                      requireApproval ? 'bg-blue-500 border-blue-400 text-black' : 'bg-slate-950 border-slate-600'
                    }`}>
                      {requireApproval && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>Require Approval</span>
                  </span>
                  <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                    requireApproval ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {requireApproval ? 'ASK FIRST' : 'AUTO-RUN'}
                  </span>
                </button>
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  {requireApproval ? 'Pauses for your review before calling the model.' : 'Runs immediately on execute.'}
                </p>
              </div>

              {/* Control C: Execution Depth */}
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-slate-200 block mb-1">
                  Execution Depth
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  {(['LOW', 'MEDIUM', 'HIGH'] as ExecutionDepth[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExecutionDepth(lvl)}
                      className={`py-1 rounded font-bold transition-all text-center cursor-pointer ${
                        executionDepth === lvl
                          ? 'bg-[#D97757] text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={
                        lvl === 'LOW'
                          ? 'LOW: Faster and economical execution for straightforward tasks.'
                          : lvl === 'MEDIUM'
                          ? 'MEDIUM: Balanced execution for ordinary tasks.'
                          : 'HIGH: More capable reasoning for complex tasks.'
                      }
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-tight truncate">
                  {executionDepth === 'LOW' && 'Fast & economical.'}
                  {executionDepth === 'MEDIUM' && 'Balanced for standard tasks.'}
                  {executionDepth === 'HIGH' && 'Deep reasoning for complex tasks.'}
                </p>
              </div>
            </div>

            {/* Title & Task Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  value={contract.title}
                  onChange={(e) => setContract({ ...contract, title: e.target.value })}
                  placeholder="e.g., Python Data Cleaner or Bed Allocation API"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-sans text-slate-100 focus:border-[#D97757] focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                  A simple name to identify this task in logs and reports.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Task Type</label>
                <select
                  value={contract.taskType}
                  onChange={(e) => setContract({ ...contract, taskType: e.target.value as TaskType })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:border-[#D97757] focus:outline-none cursor-pointer"
                >
                  <option value="coding">coding</option>
                  <option value="text">text / general</option>
                  <option value="research">research</option>
                  <option value="data_analysis">data_analysis</option>
                  <option value="writing">writing</option>
                  <option value="image">image generation</option>
                  <option value="video">video generation</option>
                </select>
                <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                  Category of work.
                </span>
              </div>
            </div>

            {/* Main Action: Describe what you want the AI to do */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono font-bold text-slate-200">
                    Describe what you want the AI to do:
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-[#E2896B] border border-slate-700">
                    {detectedLang}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ~{autoRoute.estimatedInputTokens} tokens
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartAndConfigureIntent()}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-[#E2896B] hover:text-[#D97757] bg-[#D97757]/10 border border-[#D97757]/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Auto-analyze task and configure requirements"
                >
                  <Wand2 className="w-3 h-3" />
                  Auto-Analyze
                </button>
              </div>

              <textarea
                rows={4}
                value={contract.objective}
                onChange={(e) => setContract({ ...contract, objective: e.target.value })}
                placeholder="Type your task, question, or instructions here in plain English..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:border-[#D97757] focus:outline-none resize-none font-sans"
              />
            </div>

            {/* Prompt Format Selection */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#E2896B]" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Prompt Format
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isManualFormat && (
                    <button
                      type="button"
                      onClick={() => setIsManualFormat(false)}
                      className="text-[10px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Auto-Detect
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {isManualFormat ? `Manual: ${selectedFormat}` : `Recommended: ${aiReviewResult.recommendedFormat.format}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PROMPT_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setIsManualFormat(true);
                      setSelectedFormat(fmt);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer border ${
                      selectedFormat === fmt
                        ? 'bg-[#D97757]/20 border-[#D97757] text-[#E2896B] font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {selectedFormat === 'Custom Template' ? (
                <div className="pt-2 space-y-1.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Your Custom Template (saved automatically):</span>
                    <div className="flex items-center gap-1">
                      {['{{task}}', '{{requirements}}', '{{depth}}'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const updated = `${customTemplateText}${customTemplateText.endsWith(' ') || customTemplateText.endsWith('\n') ? '' : ' '}${tag}`;
                            setCustomTemplateText(updated);
                            try { localStorage.setItem('token_os_custom_template', updated); } catch {}
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[#E2896B] border border-slate-700 cursor-pointer"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={customTemplateText}
                    onChange={(e) => {
                      setCustomTemplateText(e.target.value);
                      try { localStorage.setItem('token_os_custom_template', e.target.value); } catch {}
                    }}
                    placeholder="Write your template using {{task}} and {{requirements}}..."
                    className="w-full bg-slate-950 border border-[#D97757]/50 rounded-lg p-2 text-[11px] text-slate-100 font-mono focus:border-[#D97757] focus:outline-none resize-none"
                  />
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-400 font-sans leading-tight">
                  {aiReviewResult.recommendedFormat.reason}
                </p>
              )}
            </div>

            {/* Model Recommendation Card (Choosing the Right AI Model) */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#D97757]" />
                  <span className="font-bold text-slate-200">Choosing the Right AI Model</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    autoRoute.taskComplexity === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-800' :
                    autoRoute.taskComplexity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {executionDepth} DEPTH • {autoRoute.taskComplexity} COMPLEXITY
                  </span>
                </div>

                {/* Auto vs Manual Switcher */}
                <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRoutingMode('auto');
                      setSelectedProvider?.('auto');
                      setSelectedModel?.('auto');
                    }}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      routingMode === 'auto'
                        ? 'bg-[#D97757] text-black shadow-[0_0_10px_rgba(217,119,87,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>AUTOMATIC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoutingMode('manual');
                      if (selectedProvider === 'auto') {
                        setSelectedProvider?.(autoRoute.recommendedProvider);
                        setSelectedModel?.(autoRoute.recommendedModel);
                      }
                    }}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      routingMode === 'manual'
                        ? 'bg-[#D97757] text-black shadow-[0_0_10px_rgba(217,119,87,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>MANUAL</span>
                  </button>
                </div>
              </div>

              {routingMode === 'auto' ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Selected Model:</span>
                      <span className="text-slate-100 font-bold truncate block">{autoRoute.recommendedModel}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Inference Provider:</span>
                      <span className="text-[#E2896B] font-bold capitalize truncate block">{autoRoute.recommendedProvider}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Execution Depth:</span>
                      <span className="text-emerald-400 font-bold block">{executionDepth}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Est. Cost / Run:</span>
                      <span className="text-emerald-400 font-bold block">
                        {promptLabMetrics.calculatedCost === 0 ? '$0.0000 (Free)' : `$${promptLabMetrics.calculatedCost.toFixed(5)}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <strong>Why chosen:</strong> {autoRoute.reasoning}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Inference Provider</label>
                      <select
                        value={effectiveProvider}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setSelectedProvider?.(prov);
                          const list = providerModelsMap[prov] || [];
                          if (list.length > 0) {
                            setSelectedModel?.(list[0].value);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-[#D97757] focus:outline-none cursor-pointer"
                      >
                        <option value="gemini">Google AI Studio (Gemini Flash & Pro)</option>
                        <option value="groq">Groq Cloud (Ultra-Fast Free Tier)</option>
                        <option value="openrouter">OpenRouter (Free & Paid Gateway)</option>
                        <option value="nvidia">NVIDIA NIM Cloud API</option>
                        <option value="ollama">Ollama Local Instance (Offline)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Model Selection (Verified Tier)</label>
                      <select
                        value={effectiveModel}
                        onChange={(e) => setSelectedModel?.(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-[#D97757] focus:outline-none cursor-pointer"
                      >
                        {(providerModelsMap[effectiveProvider] || providerModelsMap.gemini || []).map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] bg-slate-950/70 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="text-amber-400">
                      Rate: <strong>{providerUsageStats.rateCard.label}</strong>
                    </span>
                    <span className="text-slate-300">
                      Est. Cost: <strong className="text-emerald-400">${promptLabMetrics.calculatedCost.toFixed(5)}</strong> • P50: <strong className="text-blue-300">~{promptLabMetrics.currentP50}ms</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Provider Quota, Used Today & Credits/Tokens Left */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-200 font-bold">{effectiveModel}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span className="text-[10px] text-emerald-400">{activeQuota.statusLabel}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span>Used Today: <strong className="text-slate-200 font-mono">{providerUsageStats.tokensUsedToday.toLocaleString()} tok</strong> ({providerUsageStats.runsToday} runs)</span>
                      <span>•</span>
                      <span>Quota Left: <strong className="text-emerald-400 font-mono">{providerUsageStats.remainingRpd}</strong></span>
                    </div>
                  </div>
                </div>

                {onOpenApiKeyVault && (
                  <button
                    type="button"
                    onClick={onOpenApiKeyVault}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#E2896B] hover:text-[#D97757] bg-slate-950 hover:bg-slate-900 border border-slate-800 px-2.5 py-1 rounded cursor-pointer transition-colors"
                  >
                    <span>Manage Keys & Credits</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Time & Usage Limits (Hard Constraints) */}
            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Time & Usage Limits
                </h3>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border transition-all ${
                    isAutoConstraintMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {isAutoConstraintMode ? <Sparkles className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-amber-400" />}
                    {isAutoConstraintMode ? 'AI-Calibrated' : 'Manual Override'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isAutoConstraintMode) {
                        setContract(prev => ({
                          ...prev,
                          hardConstraints: {
                            ...prev.hardConstraints,
                            maxTokens: autoConstraints.maxTokens,
                            maxLatencyMs: autoConstraints.maxLatencyMs,
                            maxCostUsd: autoConstraints.maxCostUsd,
                            localOnly: autoConstraints.localOnly
                          }
                        }));
                      }
                      setIsAutoConstraintMode(!isAutoConstraintMode);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isAutoConstraintMode ? <Unlock className="w-3 h-3 text-slate-400" /> : <Lock className="w-3 h-3 text-slate-400" />}
                    <span>{isAutoConstraintMode ? 'Unlock Manual' : 'Reset to Auto'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Constraint Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {/* Max Cost */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Max Cost ($)</span>
                    {isAutoConstraintMode && <span className="text-[9px] text-emerald-400">Auto</span>}
                  </div>
                  {isAutoConstraintMode ? (
                    <div className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-slate-100 text-xs font-semibold flex items-center justify-between">
                      <span>${contract.hardConstraints.maxCostUsd.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400">{autoConstraints.isFreeTier ? 'Free' : 'Cap'}</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={contract.hardConstraints.maxCostUsd}
                      onChange={(e) => handleHardConstraintChange('maxCostUsd', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs"
                    />
                  )}
                </div>

                {/* Max Tokens */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Max Tokens</span>
                    {isAutoConstraintMode && <span className="text-[9px] text-emerald-400">Auto</span>}
                  </div>
                  {isAutoConstraintMode ? (
                    <div className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-slate-100 text-xs font-semibold flex items-center justify-between">
                      <span>{contract.hardConstraints.maxTokens.toLocaleString()}</span>
                      <span className="text-[9px] text-[#E2896B]">{autoConstraints.complexity}</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={contract.hardConstraints.maxTokens}
                      onChange={(e) => handleHardConstraintChange('maxTokens', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs"
                    />
                  )}
                </div>

                {/* Max Latency */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Max Latency</span>
                    {isAutoConstraintMode && <span className="text-[9px] text-emerald-400">Auto</span>}
                  </div>
                  {isAutoConstraintMode ? (
                    <div className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-slate-100 text-xs font-semibold flex items-center justify-between">
                      <span>{contract.hardConstraints.maxLatencyMs}ms</span>
                      <span className="text-[9px] text-slate-400">Limit</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={contract.hardConstraints.maxLatencyMs}
                      onChange={(e) => handleHardConstraintChange('maxLatencyMs', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs"
                    />
                  )}
                </div>

                {/* Local Only */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Local Only</span>
                    {isAutoConstraintMode && <span className="text-[9px] text-emerald-400">Auto</span>}
                  </div>
                  <button
                    disabled={isAutoConstraintMode}
                    onClick={() => handleHardConstraintChange('localOnly', !contract.hardConstraints.localOnly)}
                    className={`w-full py-1 rounded font-bold transition-colors text-xs flex items-center justify-center gap-1 ${
                      isAutoConstraintMode ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      contract.hardConstraints.localOnly
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {contract.hardConstraints.localOnly ? 'ENFORCED' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* User-defined specific requirements (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-300">
                    Specific Test Requirements ({contract.requirements.length})
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Optional
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Add specific rules for the quality gate to test
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {contract.requirements.length === 0 ? (
                  <div className="p-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 text-slate-400 text-xs text-center font-sans space-y-1">
                    <p className="text-slate-300 font-medium">No custom test rules added</p>
                    <p className="text-[11px] text-slate-400">
                      TokenOS will verify outputs using standard quality checks. Add custom rules here if you need strict assertions.
                    </p>
                  </div>
                ) : (
                  contract.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs">
                      <span className="text-slate-200 font-sans flex items-start gap-2">
                        <span className="text-[#D97757] font-mono font-bold">{idx + 1}.</span> {req}
                      </span>
                      <button
                        onClick={() => handleRemoveRequirement(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        title="Remove requirement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Must include unit test suite or graceful shutdown..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-[#D97757] focus:outline-none font-sans"
                />
                <button
                  onClick={handleAddRequirement}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Original vs Improved Prompt Cards & Preflight Rev-Counters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PROMPT IMPROVEMENT CARD DECK */}
          <div className="slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#E2896B]" />
                <h2 className="font-mono text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  Prompt Improvement
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                    Original vs Improved
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCopyBestPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* CARD 1: YOUR ORIGINAL PROMPT */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Card 1: Your Original Prompt
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {promptLabMetrics.origTokens} Tokens ({rawPromptText.length} chars)
                </span>
              </div>
              <div className="font-mono text-xs text-slate-300 max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                {rawPromptText || 'No prompt entered yet. Describe what you want the AI to do on the left.'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Exact user input without any modifications.
              </div>
            </div>

            {/* CARD 2: TOKENOS IMPROVED PROMPT */}
            <div className="rounded-lg border border-[#D97757]/40 bg-[#D97757]/5 p-3.5 space-y-2.5 shadow-[0_0_15px_rgba(217,119,87,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#E2896B] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Card 2: TokenOS Improved Prompt
                </span>
                <div className="flex items-center gap-2">
                  {aiReviewResult.tokenMetrics.savedTokens > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      -{aiReviewResult.tokenMetrics.savedTokens} filler tokens ({aiReviewResult.tokenMetrics.savedPct}%)
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    {effectiveImprovedPrompt ? countTokens(effectiveImprovedPrompt) : 0} Tokens
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingImprovedPrompt(!isEditingImprovedPrompt)}
                    className="text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-[#E2896B]" />
                    <span>{isEditingImprovedPrompt ? 'Done Editing' : 'Edit'}</span>
                  </button>
                  {customImprovedPromptText && (
                    <button
                      type="button"
                      onClick={() => setCustomImprovedPromptText('')}
                      className="text-[10px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                      title="Reset to generated improvement"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {isEditingImprovedPrompt ? (
                <textarea
                  rows={6}
                  value={customImprovedPromptText || aiReviewResult.improvedPrompt}
                  onChange={(e) => setCustomImprovedPromptText(e.target.value)}
                  className="w-full bg-slate-950 border border-[#D97757] rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none leading-relaxed"
                />
              ) : (
                <div className="font-mono text-xs text-slate-200 max-h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text bg-slate-950 p-2.5 rounded border border-slate-800">
                  {effectiveImprovedPrompt || (
                    <span className="text-slate-500 italic">
                      Improved prompt will appear here once you enter a task on the left.
                    </span>
                  )}
                </div>
              )}

              {/* Visual CLIP/T5 Token Budget for Image & Video tasks */}
              {rawPromptText && (contract.taskType === 'image' || contract.taskType === 'video') && (
                <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-amber-400 font-bold">Visual CLIP/T5 Token Window (77-token attention limit)</span>
                    <span className={countTokens(effectiveImprovedPrompt) <= 77 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {countTokens(effectiveImprovedPrompt)} / 77 tokens
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${countTokens(effectiveImprovedPrompt) <= 77 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.round((countTokens(effectiveImprovedPrompt) / 77) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Concise Explanation */}
              {isAiReviewEnabled && rawPromptText && aiReviewResult.whatChanged.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-sans">
                  <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                    {aiReviewResult.whatChanged.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                  <div className="text-[#E2896B] font-mono text-[10.5px]">
                    Format: {selectedFormat} — {aiReviewResult.recommendedFormat.reason}
                  </div>
                </div>
              )}
            </div>

            {/* THREE METRICS CARDS: Token Count, Cost Estimate, Latency Target */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold border-b border-slate-800/80 pb-1">
                  <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap">
                    <Coins className="w-3.5 h-3.5 shrink-0" /> Tokens
                  </span>
                  <span className="text-emerald-400 whitespace-nowrap">-{promptLabMetrics.tokenSavingsPct}%</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                    <span className="text-slate-400">Input:</span>
                    <span>{rawPromptText ? promptLabMetrics.structuredTokens : 0} tok</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                    <span className="text-slate-400">Est. Out:</span>
                    <span>~{promptLabMetrics.projectedOutputTokens} tok</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold border-b border-slate-800/80 pb-1">
                  <span className="flex items-center gap-1 text-emerald-400 whitespace-nowrap">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" /> Cost
                  </span>
                  <span className="text-[10px] text-emerald-300 font-normal whitespace-nowrap">
                    {promptLabMetrics.calculatedCost === 0 ? 'Free Tier' : 'Metered'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                    <span className="text-slate-400">Run:</span>
                    <span className="text-emerald-400 font-bold">
                      {promptLabMetrics.calculatedCost === 0 ? '$0.0000' : `$${promptLabMetrics.calculatedCost.toFixed(4)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2 text-[10px] text-slate-400 whitespace-nowrap">
                    <span>Baseline:</span>
                    <span className="text-rose-400 line-through">${promptLabMetrics.baselineCost.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold border-b border-slate-800/80 pb-1">
                  <span className="flex items-center gap-1 text-blue-400 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> Latency
                  </span>
                  <span className="text-blue-300 text-[10px] whitespace-nowrap">&lt;{promptLabMetrics.slaLatencyMs}ms</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                    <span className="text-slate-400">Est. P50:</span>
                    <span className="text-emerald-400 font-bold">~{promptLabMetrics.currentP50}ms</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 text-[10px] text-slate-400 whitespace-nowrap">
                    <span>Depth:</span>
                    <span className="text-[#E2896B]">{executionDepth}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Performance Meters & Verification Readiness */}
          <div className="slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-mono text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#E2896B]" /> Pre-Execution Validation Checks
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Ready
              </span>
            </div>

            <div className="space-y-3">
              <PerformanceMeter
                label="Removing Unnecessary Information (Context Optimization)"
                value={contextCompressionRatio}
                maxBlocks={14}
                unit="%"
                variant="positive"
              />
              <PerformanceMeter
                label="Time & Usage Limits Compliance (Cost Allocation)"
                value={estimatedCostAllocation}
                maxBlocks={14}
                unit="%"
                variant="cost"
              />
              <PerformanceMeter
                label="Result Verification Readiness (Quality Gate)"
                value={resultVerificationReadiness}
                maxBlocks={14}
                unit="%"
                variant="positive"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRE-EXECUTION APPROVAL MODAL (Triggered when "Require My Approval" is ON) */}
      <AnimatePresence>
        {isApprovalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-100 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold font-mono text-white">
                    Pre-Execution Review & Operator Approval
                  </h3>
                </div>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Original Prompt:</span>
                  <p className="font-mono text-slate-300">{rawPromptText || 'Empty prompt'}</p>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-[#D97757]/40 space-y-1">
                  <span className="text-[11px] font-mono font-bold text-[#E2896B] uppercase">Improved Prompt ({selectedFormat}):</span>
                  <p className="font-mono text-slate-200 whitespace-pre-wrap">{effectiveImprovedPrompt}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Model:</span>
                    <span className="font-bold text-slate-200">{selectedModel} ({selectedProvider.toUpperCase()})</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Execution Depth:</span>
                    <span className="font-bold text-emerald-400">{executionDepth}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-300 uppercase block">Execution Plan:</span>
                  <ol className="space-y-1 text-slate-300 list-decimal list-inside text-[11px]">
                    {aiReviewResult.executionPlan.map((p) => (
                      <li key={p.step}>
                        <strong className="text-slate-200">{p.title}:</strong> {p.detail}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer transition-colors"
                >
                  Edit / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndExecute}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Execute Task</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
