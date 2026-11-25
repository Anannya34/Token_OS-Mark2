import React, { useState, useEffect } from 'react';
import { ExecutionRun, PipelineStage } from '../../types';
import { DecisionPulse, formatFriendlyStageState } from '../common/DecisionPulse';
import { 
  RotateCcw, 
  XCircle, 
  ShieldCheck, 
  Terminal, 
  Wrench, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Code2,
  Eye,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface ExecutionControlScreenProps {
  run: ExecutionRun;
  onRetryExecution: (bypassCache?: boolean) => void;
  onNavigateToQuality?: () => void;
  onNavigateToRepair?: () => void;
  onOpenApiKeyVault?: () => void;
}

function isHtmlContent(text: string): boolean {
  if (!text) return false;
  return /<!DOCTYPE html|<html|<body|<div id="app"|<script|<style/i.test(text) || /```html[\s\S]*?```/i.test(text);
}

function extractHtml(text: string): string {
  const match = text.match(/```html([\s\S]*?)```/i);
  if (match) return match[1].trim();
  return text;
}

function RenderMarkdownContent({ content }: { content: string }) {
  if (!content) return <span className="text-slate-500">No output generated yet.</span>;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-xs">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0]?.trim();
          const code = (lang && !lang.includes(' ') && lines.length > 1) ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <div key={i} className="rounded-lg bg-[#080C14] border border-slate-800 overflow-hidden my-2 font-mono text-[11px]">
              {lang && (
                <div className="bg-slate-900/90 px-3 py-1 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase">
                  {lang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto text-emerald-300">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={i} className="space-y-1 text-slate-200">
            {lines.map((line, j) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={j} className="h-1" />;
              if (trimmed.startsWith('# ')) return <h1 key={j} className="text-sm font-bold text-white mt-2 font-mono">{trimmed.slice(2)}</h1>;
              if (trimmed.startsWith('## ')) return <h2 key={j} className="text-xs font-bold text-[#E2896B] mt-2 font-mono">{trimmed.slice(3)}</h2>;
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={j} className="ml-4 list-disc text-slate-300">{trimmed.slice(2)}</li>;
              return <p key={j} className="leading-relaxed">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

const STAGE_TITLES: Record<PipelineStage, string> = {
  Intent: 'Task Requirements',
  Policy: 'Policy Check',
  Context: 'Context Selection',
  Prompt: 'Prompt Preparation',
  Model: 'Model Selection',
  Reasoning: 'AI Execution',
  Tools: 'Tool Execution',
  Verify: 'Result Verification'
};

export const ExecutionControlScreen: React.FC<ExecutionControlScreenProps> = ({
  run,
  onRetryExecution,
  onNavigateToQuality,
  onNavigateToRepair,
  onOpenApiKeyVault
}) => {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | undefined>(() => {
    const failed = run.stages.find(s => s.state === 'failed');
    return failed ? failed.stage : 'Verify';
  });
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  // Auto-focus any failed stage when a run completes with an error/gap
  useEffect(() => {
    const failed = run.stages.find(s => s.state === 'failed');
    if (failed) {
      setSelectedStage(failed.stage);
    }
  }, [run.id, run.status]);

  const modelStage = run.stages.find(s => s.stage === 'Model');
  const isStreaming = modelStage?.state === 'active';

  const handleCopyCode = () => {
    if (!run.outputContent) return;
    navigator.clipboard.writeText(run.outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = (run.outputContent || '').split('\n').length;
  const tokenEstimate = Math.max(1, Math.round((run.outputContent || '').length / 3.8));
  const selectedTelemetry = selectedStage ? run.stages.find(s => s.stage === selectedStage) : undefined;
  const failedRequirements = (run.requirementEvaluations || []).filter(r => r.status === 'FAILED');
  const satisfiedRequirements = (run.requirementEvaluations || []).filter(r => r.status === 'SATISFIED');
  const hasFailures = run.status === 'FAILED' || run.status === 'NEEDS_IMPROVEMENT' || failedRequirements.length > 0;
  const selectedDecision = run.policyDecisions.find(a => a.isSelected);

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 slate-glass-card p-5 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : hasFailures ? 'bg-rose-500' : 'bg-[#D97757]'}`} />
            <h1 className="text-xl font-bold font-mono text-slate-100">
              Execution Control — Real-Time Control Plane
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execution ID: <span className="font-mono text-[#E2896B]">{run.id}</span> | Model: <span className="font-mono text-slate-200">{run.providerModel}</span>
          </p>
        </div>

        {/* Execution Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenApiKeyVault && (
            <button
              onClick={onOpenApiKeyVault}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-[#E2896B] font-mono text-xs px-3 py-2 rounded-lg border border-[#D97757]/40 cursor-pointer transition-colors"
              title="Configure API Keys"
            >
              <Zap className="w-3.5 h-3.5 text-[#D97757]" />
              <span>API Key Vault</span>
            </button>
          )}

          <button
            onClick={() => onRetryExecution(true)}
            disabled={isStreaming}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-mono text-xs px-3.5 py-2 rounded-lg border border-slate-700 cursor-pointer transition-colors"
            title="Bypass cache and run a fresh request against the model"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E2896B]" />
            <span>Re-run Fresh</span>
          </button>

          {hasFailures && onNavigateToRepair && (
            <button
              onClick={onNavigateToRepair}
              className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 font-mono font-bold text-xs px-3.5 py-2 rounded-lg border border-rose-500/50 cursor-pointer transition-colors"
              title="Patch only failed requirements without regenerating everything"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>Targeted Fix (IPAR)</span>
            </button>
          )}

          {onNavigateToQuality && (
            <button
              onClick={onNavigateToQuality}
              className="flex items-center gap-1.5 bg-[#D97757] hover:bg-[#E2896B] text-black font-mono font-bold text-xs px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(217,119,87,0.3)] cursor-pointer transition-all"
            >
              <span>Quality Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Signature Component: Decision Pulse + Inline Stage Inspector */}
      <DecisionPulse
        stages={run.stages}
        activeStage={selectedStage}
        onSelectStage={(stage) => setSelectedStage(prev => prev === stage ? undefined : stage)}
      >
        {selectedTelemetry && selectedStage && (
          <div className="space-y-3 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedTelemetry.state === 'failed' ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : selectedTelemetry.state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-bold text-slate-100">
                  {STAGE_TITLES[selectedStage]} Details
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  selectedTelemetry.state === 'failed'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                    : selectedTelemetry.state === 'completed'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {formatFriendlyStageState(selectedTelemetry.state)} • {selectedTelemetry.durationMs}ms
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-sans">
                {selectedTelemetry.details}
              </span>
            </div>

            {/* Detailed Verification Breakdown when Verify stage or any failed stage is selected */}
            {(selectedStage === 'Verify' || selectedTelemetry.state === 'failed') && (run.requirementEvaluations || []).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {failedRequirements.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-rose-300 font-bold text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Failed: {req.requirement}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        FAILED
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-200/80 font-sans">
                      {req.failureReason || 'Requirement not satisfied by output.'}
                    </p>
                  </div>
                ))}

                {satisfiedRequirements.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Passed: {req.requirement}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        VERIFIED
                      </span>
                    </div>
                    {req.evidenceFound && (
                      <p className="text-[11px] text-emerald-200/75 font-sans">
                        {req.evidenceFound}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DecisionPulse>

      {/* Primary Centerpiece: Live Streaming Output Terminal */}
      <div className="slate-glass-card rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#0B0F17]/80 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#D97757]" />
            <span className="font-bold text-slate-100">Live Model Stream Output</span>
            {isStreaming ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAMING TOKENS
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                COMPLETE ({lineCount} lines)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Tokens:</span>
              {isStreaming ? (
                <strong className="text-slate-200">~{tokenEstimate} <span className="text-[10px] text-amber-400 font-normal">(streaming...)</span></strong>
              ) : (
                <strong className="text-slate-200">
                  {run.provenance === 'provider_reported' ? run.totalTokens : `~${run.totalTokens || tokenEstimate}`}
                  {run.inputTokens !== undefined && run.outputTokens !== undefined && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (in: {run.inputTokens} | out: {run.outputTokens})
                    </span>
                  )}
                </strong>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                run.provenance === 'provider_reported' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                run.provenance === 'measured_locally' ? 'bg-sky-950 text-sky-400 border-sky-800' :
                run.provenance === 'unavailable' ? 'bg-red-950 text-red-400 border-red-800' :
                'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                {run.provenance === 'provider_reported' ? 'Provider Reported' :
                 run.provenance === 'measured_locally' ? 'Local Hardware' :
                 run.provenance === 'unavailable' ? 'Failed' : 'Estimated'}
              </span>
            </div>

            <span>
              Latency: <strong className="text-emerald-400">{run.cachedTokens ? '0ms (Cache)' : `${run.totalLatencyMs}ms`}</strong>
            </span>

            <span>
              Cost: <strong className={run.totalCostUsd === 0 ? 'text-emerald-400' : 'text-[#D97757]'}>
                {run.totalCostUsd === 0 ? '$0.00 (Free Tier)' : `$${run.totalCostUsd.toFixed(5)}`}
              </strong>
            </span>

            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'code' ? 'bg-[#1E293B] text-[#D97757] font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'preview' ? 'bg-[#1E293B] text-[#D97757] font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              disabled={!run.outputContent}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {viewMode === 'code' ? (
          <div className="p-4 bg-[#080C14] font-mono text-xs leading-relaxed text-slate-100 max-h-[460px] overflow-y-auto overflow-x-auto relative">
            {run.outputContent ? (
              <pre className="whitespace-pre">
                {run.outputContent}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-[#D97757] animate-pulse align-middle" />
                )}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-mono text-xs space-y-2">
                <span className="w-3 h-3 rounded-full bg-[#D97757] animate-ping" />
                <span>Awaiting model inference execution...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-950 min-h-[280px] max-h-[460px] overflow-y-auto relative">
            {isHtmlContent(run.outputContent) ? (
              <iframe
                title="Live Output Preview"
                srcDoc={extractHtml(run.outputContent)}
                className="w-full h-[380px] bg-white rounded-lg border border-slate-700 shadow-inner"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <RenderMarkdownContent content={run.outputContent} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Telemetry: Redesigned Model Decision Matrix & Execution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy Engine Decision Matrix & Rationale */}
        <div className="lg:col-span-7 slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="font-mono text-sm font-semibold text-[#E2896B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Model Selection & Decision Matrix
            </h2>
            <span className="text-[11px] font-mono text-slate-200 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
              Serving: <strong className="text-[#D97757]">{run.actualServingModel || run.providerModel}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10.5px] uppercase bg-slate-900/60">
                  <th className="p-2.5">Candidate Model</th>
                  <th className="p-2.5 text-center">Est. Quality</th>
                  <th className="p-2.5 text-center">Est. Cost</th>
                  <th className="p-2.5 text-center">Utility</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {run.policyDecisions.map((act) => (
                  <tr
                    key={act.actionId}
                    className={`transition-colors ${act.isSelected ? 'bg-[#D97757]/10 border-l-2 border-l-[#D97757]' : 'hover:bg-slate-900/40'}`}
                  >
                    <td className="p-2.5 font-sans font-medium text-slate-200">
                      {act.description.replace(/^Route to\s+/i, '')}
                    </td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">
                      {(act.expectedQualityGain * 100).toFixed(0)}%
                    </td>
                    <td className="p-2.5 text-center text-amber-400">
                      ${act.costEstimateUsd.toFixed(4)}
                    </td>
                    <td className="p-2.5 text-center font-bold text-[#E2896B]">
                      {act.utilityScore.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right">
                      {act.isSelected ? (
                        <span className="px-2 py-0.5 rounded bg-[#D97757]/20 text-[#E2896B] border border-[#D97757]/40 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 text-[10px]">
                          STANDBY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedDecision && (
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[11px] text-[#E2896B] font-semibold block mb-0.5">
                  Selection Rationale
                </span>
                <p className="text-slate-300 font-sans text-[11.5px] leading-relaxed">
                  {selectedDecision.rationale}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Redesigned Execution Event Stream (Clean Timeline) */}
        <div className="lg:col-span-5 slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-mono text-sm font-semibold text-[#E2896B] flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Execution Event Stream
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Total: {run.totalLatencyMs}ms
            </span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {run.stages.map((stg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedStage(stg.stage)}
                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  selectedStage === stg.stage
                    ? 'bg-slate-900/90 border-[#D97757]/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  stg.state === 'completed' ? 'bg-emerald-400' :
                  stg.state === 'failed' ? 'bg-rose-500' :
                  stg.state === 'active' ? 'bg-[#D97757] animate-ping' :
                  'bg-slate-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10.5px]">
                    <span className={`font-bold ${
                      stg.state === 'failed' ? 'text-rose-400' :
                      stg.state === 'completed' ? 'text-emerald-400' :
                      'text-slate-300'
                    }`}>
                      {STAGE_TITLES[stg.stage] || stg.stage}
                    </span>
                    <span className="text-slate-500">{stg.durationMs}ms</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
                    {stg.details}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
