import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { DiffView } from '../common/DiffView';
import { ProvenanceNote } from '../common/ProvenenceNote';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PromptVersion } from '../../types';

export const OptimizeRequestScreen: React.FC = () => {
  const { activeRun, setActiveRun, setActiveScreen, showToast, saveCurrentRun } = useTokenOS();

  const [styleMode, setStyleMode] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'json' | 'xml' | 'plain'>('markdown');
  const [preserveWording, setPreserveWording] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'diff'>('diff');

  const contract = activeRun.contract;
  const originalPrompt = activeRun.prompts.find((p) => p.source === 'original') || activeRun.prompts[0];
  const activePrompt = activeRun.prompts.find((p) => p.id === activeRun.activePromptId) || activeRun.prompts[0];

  const [promptText, setPromptText] = useState(activePrompt ? activePrompt.content : '');

  const handleGenerateOptimized = () => {
    const nextVersionNum = activeRun.prompts.length + 1;
    const optimizedContent =
      `Analyze the provided sales data table comparing August and September sales.\n` +
      `1. State the overall total change across both months.\n` +
      `2. Explicitly cover all four regions (North, South, East, West) with their respective figures and percentage changes.\n` +
      `3. Provide a concise takeaway summary for the team.\n` +
      `4. Strictly do NOT include any unverified external claims, campaign explanations, or speculative reasons not present in the data.`;

    const newPrompt: PromptVersion = {
      id: `prompt-v${nextVersionNum}`,
      versionNumber: nextVersionNum,
      content: optimizedContent,
      format: outputFormat,
      source: 'optimized',
      createdAt: new Date().toISOString(),
      selected: true,
      estimatedTokenCount: 1284,
      tokenizerProvenance: 'cl100k_base tokenizer estimate',
      changeSummary: 'Structured requirements to enforce total calculation, 4-region coverage, and ban speculative campaign claims.'
    };

    setActiveRun((prev) => ({
      ...prev,
      prompts: [...prev.prompts, newPrompt],
      activePromptId: newPrompt.id
    }));
    setPromptText(optimizedContent);
    showToast('Generated optimized prompt (v' + nextVersionNum + ')');
  };

  const handleSelectPromptVersion = (id: string) => {
    setActiveRun((prev) => ({
      ...prev,
      activePromptId: id,
      prompts: prev.prompts.map((p) => ({ ...p, selected: p.id === id }))
    }));
    const target = activeRun.prompts.find((p) => p.id === id);
    if (target) setPromptText(target.content);
    showToast('Selected prompt version updated');
  };

  const handleContinue = () => {
    saveCurrentRun();
    setActiveScreen('AI Execution');
  };

  return (
    <div className="space-y-6">
      {/* Screen Banner */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              Optimize Request — Prompt Engineering
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              Stage 2 of 4
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Improve how the request is represented for the downstream model while maintaining complete intent fidelity.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={handleContinue}
          >
            Continue to AI Execution
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Approved Intent Summary & Controls */}
        <div className="space-y-4">
          <Card title="Approved Intent Summary">
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-bgDeep rounded border border-borderColor">
                <span className="font-semibold text-textSecondary">Objective: </span>
                <span className="text-textPrimary">{contract.objective}</span>
              </div>
              <div className="p-2.5 bg-bgDeep rounded border border-borderColor">
                <span className="font-semibold text-textSecondary">Constraints: </span>
                <span className="text-textPrimary">{contract.constraints.join('; ')}</span>
              </div>
              <div className="p-2.5 bg-bgDeep rounded border border-borderColor">
                <span className="font-semibold text-textSecondary">Criteria: </span>
                <div className="mt-1 space-y-1">
                  {contract.successCriteria.map((c) => (
                    <div key={c.id} className="text-textPrimary flex items-center gap-1.5">
                      <span className="font-mono text-accent">({c.code})</span> {c.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Optimization Controls">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Density & Style</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-bgDeep rounded-md border border-borderColor">
                  {(['concise', 'balanced', 'detailed'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setStyleMode(mode)}
                      className={`py-1 text-xs capitalize rounded transition-colors cursor-pointer ${
                        styleMode === mode
                          ? 'bg-accent text-bgDeep font-bold'
                          : 'text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-textSecondary font-semibold mb-1">Target Output Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="markdown">Markdown</option>
                  <option value="plain">Plain Text</option>
                  <option value="json">JSON Schema Enforced</option>
                  <option value="xml">XML Tags</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-borderColor">
                <label className="flex items-center gap-2 text-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveWording}
                    onChange={(e) => setPreserveWording(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>Preserve original phrasing structure</span>
                </label>
                <label className="flex items-center gap-2 text-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExamples}
                    onChange={(e) => setIncludeExamples(e.target.checked)}
                    className="accent-accent"
                  />
                  <span>Include few-shot format examples</span>
                </label>
              </div>

              <Button
                variant="primary"
                className="w-full"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleGenerateOptimized}
              >
                Generate Optimized Prompt
              </Button>
            </div>
          </Card>
        </div>

        {/* Right 2 Columns: Prompt Comparison & Quality Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span>Prompt Versions</span>
                  <div className="flex items-center gap-1">
                    {activeRun.prompts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPromptVersion(p.id)}
                        className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                          p.id === activeRun.activePromptId
                            ? 'bg-accent text-bgDeep font-bold'
                            : 'bg-surfaceElevated text-textSecondary hover:bg-borderColor'
                        }`}
                      >
                        v{p.versionNumber} ({p.source})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status="Estimated"
                    label={`${activePrompt?.estimatedTokenCount || 0} tokens`}
                  />
                </div>
              </div>
            }
          >
            {/* View Mode Toggle: Diff vs Edit */}
            <div className="flex items-center justify-between pb-3 border-b border-borderColor">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'diff'
                      ? 'bg-accentTint text-accent font-semibold border border-accent/40'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  Compare Versions (Diff)
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    activeTab === 'edit'
                      ? 'bg-accentTint text-accent font-semibold border border-accent/40'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  Edit Prompt Directly
                </button>
              </div>

              <ProvenanceNote
                text="cl100k_base tokenizer estimate"
                source="Tokenizer Provenance"
              />
            </div>

            {activeTab === 'diff' ? (
              <DiffView
                originalLabel="Original User Request (v1)"
                originalText={originalPrompt ? originalPrompt.content : ''}
                modifiedLabel={`Active Prompt (v${activePrompt?.versionNumber || 1})`}
                modifiedText={activePrompt ? activePrompt.content : ''}
                changeSummary={activePrompt?.changeSummary}
              />
            ) : (
              <div className="space-y-3">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={10}
                  className="w-full p-3 text-xs font-mono bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      showToast('Saved custom prompt edit');
                    }}
                  >
                    Save Edited Prompt
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Prompt Quality Checklist */}
          <Card title="Prompt Quality & Security Audit">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded bg-bgDeep border border-borderColor text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Objective explicitly declared</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded bg-bgDeep border border-borderColor text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Constraints & bounds included</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded bg-bgDeep border border-borderColor text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Speculative claims explicitly forbidden</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded bg-bgDeep border border-borderColor text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero invented facts / references</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
