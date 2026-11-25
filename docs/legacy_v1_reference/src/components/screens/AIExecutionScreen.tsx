import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { PipelineStepper } from '../common/PipelineStepper';
import { ProvenanceNote } from '../common/ProvenenceNote';
import {
  Play,
  Square,
  Paperclip,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { PipelineStage } from '../../types';

export const AIExecutionScreen: React.FC = () => {
  const { activeRun, setActiveRun, setActiveScreen, showToast, saveCurrentRun } = useTokenOS();
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecutingStage, setCurrentExecutingStage] = useState<PipelineStage | undefined>();
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'trace' | 'logs'>('output');

  const config = activeRun.config;
  const activePrompt = activeRun.prompts.find((p) => p.id === activeRun.activePromptId) || activeRun.prompts[0];
  const activeAnswer = activeRun.answers[activeRun.answers.length - 1];
  const usage = activeRun.usageHistory[activeRun.usageHistory.length - 1];

  const handleUpdateConfig = (field: keyof typeof config, val: any) => {
    setActiveRun((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: val }
    }));
  };

  const handleRunRequest = () => {
    setIsRunning(true);
    showToast('Executing request through TokenOS control pipeline...');

    const stages: PipelineStage[] = ['Intent', 'Policy', 'Context', 'Model', 'Reasoning', 'Tools', 'Verify'];
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < stages.length) {
        const stage = stages[stepIndex];
        setCurrentExecutingStage(stage);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setCurrentExecutingStage(undefined);
        saveCurrentRun();
        showToast('Pipeline execution completed! Answer v1 produced.');
      }
    }, 400);
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    setCurrentExecutingStage(undefined);
    showToast('Execution stopped by user');
  };

  const handleOpenCheckAnswer = () => {
    saveCurrentRun();
    setActiveScreen('Check Answer');
  };

  return (
    <div className="space-y-6">
      {/* Screen Header Banner */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              AI Execution — Operational Control Plane
            </h2>
            <StatusBadge status="DEMO" label="DEMO MODE ENGINE" />
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              Stage 3 of 4
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Configure execution policy, budget caps, and run through the 7-stage deterministic pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isRunning ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={handleStopExecution}
            >
              Stop Execution
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={handleRunRequest}
            >
              Run Request
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={handleOpenCheckAnswer}
          >
            Open Result in Check Answer
          </Button>
        </div>
      </div>

      {/* Section 1: Request Preview */}
      <Card title="1. Active Request & Contract Preview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-bgDeep rounded border border-borderColor">
            <span className="font-semibold text-textSecondary block mb-1">Active Prompt (v{activePrompt?.versionNumber}):</span>
            <p className="font-mono text-textPrimary line-clamp-3 leading-relaxed">
              {activePrompt?.content}
            </p>
          </div>
          <div className="p-3 bg-bgDeep rounded border border-borderColor">
            <span className="font-semibold text-textSecondary block mb-1">Intent Contract Summary:</span>
            <p className="text-textPrimary leading-relaxed">
              <span className="font-semibold text-accent">Objective:</span> {activeRun.contract.objective}<br />
              <span className="font-semibold text-accent">Criteria:</span> {activeRun.contract.successCriteria.map(c => `(${c.code}) ${c.text}`).join('; ')}
            </p>
          </div>
        </div>
      </Card>

      {/* Grid: Config Sections 2, 3, 4, 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Config Panel */}
        <div className="space-y-4">
          {/* Section 2: Provider & Model Selector */}
          <Card title="2. Provider & Model Selection">
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Provider Integration</label>
                <select
                  value={config.provider}
                  onChange={(e) => handleUpdateConfig('provider', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent font-mono"
                >
                  <option value="Demo Provider (Simulated)">Demo Provider (Simulated Fixture Engine)</option>
                  <option value="OpenAI Direct (Unavailable)" disabled>OpenAI Direct (Requires Key in Config)</option>
                  <option value="Anthropic Direct (Unavailable)" disabled>Anthropic Direct (Requires Key in Config)</option>
                </select>
              </div>
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Target Model Profile</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => handleUpdateConfig('model', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Execution Policy */}
          <Card title="3. Execution Policy & Policy Guardrails">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Context Strategy</label>
                <input
                  type="text"
                  value={config.contextStrategy}
                  onChange={(e) => handleUpdateConfig('contextStrategy', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Reasoning Effort</label>
                <select
                  value={config.reasoningEffort}
                  onChange={(e) => handleUpdateConfig('reasoningEffort', e.target.value as any)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="off">Off (0 tok)</option>
                  <option value="low">Low Effort</option>
                  <option value="medium">Medium Effort</option>
                  <option value="high">High Effort</option>
                </select>
              </div>
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Timeout (Sec)</label>
                <input
                  type="number"
                  value={config.timeoutSec}
                  onChange={(e) => handleUpdateConfig('timeoutSec', Number(e.target.value))}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Retry Policy</label>
                <input
                  type="text"
                  value={config.retryPolicy}
                  onChange={(e) => handleUpdateConfig('retryPolicy', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Config Panel */}
        <div className="space-y-4">
          {/* Section 4: Budget */}
          <Card title="4. Budget & Cost Limits">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Max Output Tokens</label>
                <input
                  type="number"
                  value={config.maxOutputTokens}
                  onChange={(e) => handleUpdateConfig('maxOutputTokens', Number(e.target.value))}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Hard Cost Cap ($ USD)</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.costLimitUsd}
                  onChange={(e) => handleUpdateConfig('costLimitUsd', Number(e.target.value))}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="mt-3">
              <ProvenanceNote
                text="Cost provenance: demo rate card ($3.00 / 1M input, $12.00 / 1M output)."
                isDemo
              />
            </div>
          </Card>

          {/* Section 5: Context & Tools */}
          <Card title="5. Context & MCP Tools">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-bgDeep rounded border border-borderColor flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-textPrimary">Attached Document: Synthetic Sales Data</span>
                </div>
                <span className="text-[11px] font-mono text-textMuted">5 rows, 4 cols</span>
              </div>

              <div className="p-3 bg-bgDeep rounded border border-borderColor flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-success" />
                  <span className="font-semibold text-textPrimary">Enabled MCP Tools: MCP File Reader, MCP Calc</span>
                </div>
                <StatusBadge status="LIVE" label="Local Active" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 6: Execution Pipeline Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textPrimary">
            6. Pipeline Execution Stepper
          </h3>
          {currentExecutingStage && (
            <span className="text-xs text-accent font-mono animate-pulse">
              Running stage: {currentExecutingStage}...
            </span>
          )}
        </div>
        <PipelineStepper
          stages={activeRun.pipelineEvents.map((e) => ({
            stage: e.stage,
            status: isRunning && e.stage === currentExecutingStage ? 'active' : e.status,
            detail: e.detail
          }))}
          activeStage={currentExecutingStage}
        />
      </div>

      {/* Section 7 & 8: Run Output & Usage Trace */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span>7. Run Output & Trace</span>
              <div className="flex items-center gap-1">
                {(['output', 'trace', 'logs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveOutputTab(tab)}
                    className={`px-3 py-1 text-xs capitalize rounded cursor-pointer ${
                      activeOutputTab === tab
                        ? 'bg-accent text-bgDeep font-bold'
                        : 'text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {usage && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <StatusBadge status="DEMO" label="DEMO, synthetic" />
                <span className="text-textSecondary">
                  {usage.inputTokens + usage.outputTokens} tok ({usage.durationSec}s) — ${usage.costUsd.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        }
      >
        {activeOutputTab === 'output' && (
          <div className="space-y-3">
            <div className="p-4 bg-bgDeep rounded-card border border-borderColor">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-borderColor text-xs">
                <span className="font-semibold text-textSecondary">Answer v{activeAnswer?.versionNumber || 1} Output</span>
                <span className="font-mono text-[11px] text-textMuted">Iteration {activeAnswer?.iteration || 0}</span>
              </div>
              <pre className="text-xs font-mono text-textPrimary whitespace-pre-wrap leading-relaxed">
                {activeAnswer ? activeAnswer.content : 'No output generated yet. Click "Run Request" above.'}
              </pre>
            </div>
          </div>
        )}

        {activeOutputTab === 'trace' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-2">
              <h4 className="font-semibold text-textPrimary">Tool Call Record</h4>
              {activeRun.toolCalls.map((tc) => (
                <div key={tc.id} className="p-2 bg-surface rounded border border-borderColor/60 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-accent">
                    <span>{tc.toolName}</span>
                    <span>{tc.timestamp}</span>
                  </div>
                  <div className="text-textSecondary mt-1">Input: {tc.input}</div>
                  <div className="text-success mt-0.5">Output: {tc.output}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeOutputTab === 'logs' && (
          <div className="space-y-2">
            {activeRun.pipelineEvents.map((e, idx) => (
              <div key={idx} className="p-2.5 bg-bgDeep rounded border border-borderColor/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-textMuted">[{e.timestamp}]</span>
                  <span className="text-accent font-bold">[{e.stage}]</span>
                  <span className="text-textPrimary">{e.eventType}: {e.detail}</span>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-borderColor flex items-center justify-between text-xs">
          <ProvenanceNote
            text="Usage metrics reported via demo rate card provenance."
            source={usage ? usage.provenance : 'Synthetic'}
            isDemo
          />

          <Button
            size="sm"
            variant="primary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={handleOpenCheckAnswer}
          >
            Open Result in Check Answer
          </Button>
        </div>
      </Card>
    </div>
  );
};
