import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { ProvenanceNote } from '../common/ProvenenceNote';
import {
  Brain,
  HelpCircle,
  Plus,
  Trash2,
  ArrowRight,
  Save,
  Sparkles
} from 'lucide-react';
import { SuccessCriterion } from '../../types';

export const UnderstandRequestScreen: React.FC = () => {
  const { activeRun, setActiveRun, setActiveScreen, showToast, saveCurrentRun } = useTokenOS();
  const [requestText, setRequestText] = useState(activeRun.originalRequest);
  const [isProcessing, setIsProcessing] = useState(false);

  const contract = activeRun.contract;

  // Handle parsing / understanding request
  const handleUnderstand = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      showToast('Intent Contract extracted & validated against schema.');
    }, 600);
  };

  const handleUpdateContractField = (field: keyof typeof contract, value: any) => {
    setActiveRun((prev) => ({
      ...prev,
      originalRequest: requestText,
      contract: {
        ...prev.contract,
        [field]: value,
        version: prev.contract.version + 1
      }
    }));
  };

  const handleToggleAssumption = (id: string) => {
    const nextAssumptions = contract.assumptions.map((a) =>
      a.id === id ? { ...a, accepted: !a.accepted } : a
    );
    handleUpdateContractField('assumptions', nextAssumptions);
    showToast('Assumption status updated');
  };

  const handleAddCriterion = () => {
    const nextLetter = String.fromCharCode(97 + contract.successCriteria.length);
    const newCrit: SuccessCriterion = {
      id: `crit-${Date.now()}`,
      code: nextLetter,
      text: 'New verifiable success criterion'
    };
    handleUpdateContractField('successCriteria', [...contract.successCriteria, newCrit]);
  };

  const handleRemoveCriterion = (id: string) => {
    handleUpdateContractField(
      'successCriteria',
      contract.successCriteria.filter((c) => c.id !== id)
    );
  };

  const handleSaveDraft = () => {
    setActiveRun((prev) => ({ ...prev, originalRequest: requestText }));
    saveCurrentRun();
    showToast('Draft & Intent Contract saved');
  };

  const handleContinue = () => {
    setActiveRun((prev) => ({ ...prev, originalRequest: requestText }));
    saveCurrentRun();
    setActiveScreen('Optimize Request');
  };

  return (
    <div className="space-y-6">
      {/* Screen Header / Purpose */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              Understand Request — Intent Contract
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              Stage 1 of 4
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Turn natural language into an explicit, editable Intent Contract before downstream execution.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={handleContinue}
          >
            Continue to Optimize Request
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Natural Language Input & Optional Controls */}
        <div className="space-y-4">
          <Card
            title="Original User Request"
            subtitle="Paste raw prompt, message, or user query"
            action={
              <Button
                size="sm"
                variant="primary"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleUnderstand}
                disabled={isProcessing}
              >
                {isProcessing ? 'Deconstructing...' : 'Understand Request'}
              </Button>
            }
          >
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Paste raw request here..."
              rows={8}
              className="w-full p-3 text-xs font-mono bg-bgDeep border border-borderColor rounded-input text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent leading-relaxed"
            />
          </Card>

          <Card title="Optional Guidance & Constraints">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-textSecondary font-medium mb-1">Target Audience</label>
                <input
                  type="text"
                  value={contract.audience}
                  onChange={(e) => handleUpdateContractField('audience', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-textSecondary font-medium mb-1">Output Format</label>
                <input
                  type="text"
                  value={contract.outputFormat}
                  onChange={(e) => handleUpdateContractField('outputFormat', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </Card>

          <ProvenanceNote
            text="Schema validation active: Intent output validated against strict JSON Schema (v1.2)."
            source="TokenOS Contract Schema"
          />
        </div>

        {/* Right Column: Extracted Intent Contract Panel */}
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                <span>Extracted Intent Contract</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-surfaceElevated text-accent font-semibold border border-borderColor">
                  v{contract.version}
                </span>
              </div>
            }
            subtitle="Editable contract approved by user before optimization"
          >
            <div className="space-y-4 text-xs">
              {/* Objective */}
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Core Objective</label>
                <input
                  type="text"
                  value={contract.objective}
                  onChange={(e) => handleUpdateContractField('objective', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary font-semibold focus:outline-none focus:border-accent"
                />
              </div>

              {/* Deliverable */}
              <div>
                <label className="block text-textSecondary font-semibold mb-1">Expected Deliverable</label>
                <input
                  type="text"
                  value={contract.deliverable}
                  onChange={(e) => handleUpdateContractField('deliverable', e.target.value)}
                  className="w-full p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Success Criteria List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-textSecondary font-semibold">Success Criteria (Verifiable)</label>
                  <Button size="sm" variant="ghost" icon={<Plus className="w-3 h-3" />} onClick={handleAddCriterion}>
                    Add Criterion
                  </Button>
                </div>
                <div className="space-y-2">
                  {contract.successCriteria.map((sc, idx) => (
                    <div key={sc.id} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-bgDeep border border-borderColor text-textPrimary font-mono font-bold text-center flex items-center justify-center shrink-0">
                        {sc.code}
                      </span>
                      <input
                        type="text"
                        value={sc.text}
                        onChange={(e) => {
                          const updated = [...contract.successCriteria];
                          updated[idx].text = e.target.value;
                          handleUpdateContractField('successCriteria', updated);
                        }}
                        className="flex-1 p-2 bg-bgDeep border border-borderColor rounded-input text-textPrimary focus:outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => handleRemoveCriterion(sc.id)}
                        className="p-1 text-textMuted hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambiguities & Clarifications */}
              {contract.ambiguities.length > 0 && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-card space-y-1">
                  <div className="flex items-center gap-1.5 text-warning font-semibold">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Material Ambiguity Surfaced</span>
                  </div>
                  {contract.ambiguities.map((amb, i) => (
                    <p key={i} className="text-textSecondary pl-5">
                      • {amb}
                    </p>
                  ))}
                </div>
              )}

              {/* Assumptions (Explicitly Labelled) */}
              <div>
                <label className="block text-textSecondary font-semibold mb-2">
                  Explicit System Assumptions
                </label>
                <div className="space-y-2">
                  {contract.assumptions.map((asm) => (
                    <div
                      key={asm.id}
                      className="p-3 bg-bgDeep border border-borderColor rounded-card flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status="DEMO" label="Assumption" />
                          <span className="text-textPrimary font-medium">{asm.text}</span>
                        </div>
                        <p className="text-[11px] text-textMuted">
                          Never silently converted to fact. User confirmation required.
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleAssumption(asm.id)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer shrink-0 ${
                          asm.accepted
                            ? 'bg-success/20 text-success border-success/40 font-semibold'
                            : 'bg-surfaceElevated text-textMuted border-borderColor'
                        }`}
                      >
                        {asm.accepted ? 'Accepted' : 'Accept Assumption'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
