import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { ChecklistItem } from '../common/ChecklistItem';
import { ProvenanceNote } from '../common/ProvenenceNote';
import {
  CheckCircle,
  Copy,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';

export const CheckAnswerScreen: React.FC = () => {
  const { activeRun, setActiveRun, setActiveScreen, showToast, saveCurrentRun } = useTokenOS();
  const [copied, setCopied] = useState(false);

  const activeAnswer = activeRun.answers[activeRun.answers.length - 1];
  const activeReport = activeRun.verificationReports.find((r) => r.answerVersionId === activeAnswer?.id) || activeRun.verificationReports[0];

  const handleToggleAcceptFinding = (findingId: string) => {
    if (!activeReport) return;
    const updatedFindings = activeReport.findings.map((f) =>
      f.id === findingId ? { ...f, accepted: !f.accepted } : f
    );

    setActiveRun((prev) => ({
      ...prev,
      verificationReports: prev.verificationReports.map((r) =>
        r.id === activeReport.id ? { ...r, findings: updatedFindings } : r
      )
    }));
    showToast('Finding acceptance status updated');
  };

  const handleCopyAnswer = () => {
    if (activeAnswer) {
      navigator.clipboard.writeText(activeAnswer.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Answer copied to clipboard');
    }
  };

  const handleProceedToImprove = () => {
    saveCurrentRun();
    setActiveScreen('Improve Answer');
  };

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              Check Answer — Diagnosis & Verification Workspace
            </h2>
            {activeReport && <StatusBadge status={activeReport.overallStatus} />}
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              Stage 4 of 4
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Evaluate model output against approved Intent Contract criteria. Identify potential unsupported claims and missing coverage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyAnswer}
          >
            {copied ? 'Copied' : 'Copy Answer'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={handleProceedToImprove}
          >
            Proceed to Improve Answer
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Answer Viewer & Verification Findings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Answer Viewer */}
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>Answer Output</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-surfaceElevated text-accent font-semibold border border-borderColor">
                    v{activeAnswer?.versionNumber || 1} (Iteration {activeAnswer?.iteration || 0})
                  </span>
                </div>
                <span className="text-xs text-textMuted font-mono">
                  Traceable to Contract v{activeRun.contract.version}
                </span>
              </div>
            }
          >
            <pre className="p-4 bg-bgDeep rounded-card border border-borderColor text-xs font-mono text-textPrimary whitespace-pre-wrap leading-relaxed">
              {activeAnswer ? activeAnswer.content : 'No answer generated yet.'}
            </pre>
          </Card>

          {/* Verification Findings Grouped by Criterion */}
          <Card
            title="Intent Contract Verification Findings"
            subtitle="Criteria status evaluated with explicit Deterministic Check vs Model-based Judgment badges"
          >
            <div className="space-y-3">
              {activeReport ? (
                activeReport.findings.map((finding) => (
                  <ChecklistItem
                    key={finding.id}
                    code={finding.criterionCode}
                    text={finding.criterionText}
                    status={finding.status}
                    severity={finding.severity}
                    checkType={finding.checkType}
                    detail={finding.detail}
                    evidenceExcerpt={finding.evidenceExcerpt}
                    accepted={finding.accepted}
                    onAccept={() => handleToggleAcceptFinding(finding.id)}
                  />
                ))
              ) : (
                <p className="text-xs text-textMuted">No verification report found.</p>
              )}
            </div>
          </Card>

          {/* Limitations & Traceability Note */}
          <Card title="Confidence & Diagnostic Limitations">
            <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-2 text-xs">
              <div className="flex items-center gap-2 text-info">
                <Info className="w-4 h-4 shrink-0" />
                <span className="font-semibold">Honest Verification Disclosure</span>
              </div>
              <p className="text-textSecondary leading-relaxed">
                {activeReport?.limitations ||
                  'Model-based findings are structured judgments, not absolute proof. No system can guarantee 100% hallucination detection.'}
              </p>
              <ProvenanceNote
                text={`Report traceable to Answer ID: ${activeAnswer?.id || 'ans-v1'}, Contract Version: ${activeRun.contract.version}`}
                source="Verification Audit Trail"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Evidence Panel & Quality Dimensions */}
        <div className="space-y-4">
          <Card title="Evidence & Source Attribution">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
                <div className="flex items-center justify-between text-textPrimary font-semibold">
                  <span>Attached Source File</span>
                  <span className="text-[10px] font-mono text-accent">Synthetic Data</span>
                </div>
                <p className="text-[11px] font-mono text-textMuted">
                  Synthetic sales table (August & September regional breakdown).
                </p>
              </div>

              <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
                <div className="flex items-center justify-between text-textPrimary font-semibold">
                  <span>Tool Output Verification</span>
                  <span className="text-[10px] font-mono text-success">MCP Calc</span>
                </div>
                <p className="text-[11px] font-mono text-textMuted">
                  Sum check: 420+380+510+290 = 1600. Sept sum: 462+342+535+261 = 1600. Total change: 0.0%.
                </p>
              </div>
            </div>
          </Card>

          <Card title="7 Quality Dimensions">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">1. Intent Alignment</span>
                <StatusBadge status={activeReport?.overallStatus === 'passed' ? 'met' : 'partial'} />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">2. Completeness</span>
                <StatusBadge status={activeReport?.findings.some(f => f.criterionCode === 'a' && f.status === 'not_met') ? 'not_met' : 'met'} />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">3. Format & Schema</span>
                <StatusBadge status="met" />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">4. Evidence Coverage</span>
                <StatusBadge status="partial" />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">5. Internal Consistency</span>
                <StatusBadge status={activeReport?.findings.some(f => f.criterionCode === 'b' && f.status === 'not_met') ? 'not_met' : 'met'} />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">6. Unsupported-Claim Risk</span>
                <StatusBadge status={activeReport?.findings.some(f => f.criterionCode === 'c' && f.status === 'not_met') ? 'not_met' : 'met'} />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bgDeep border border-borderColor">
                <span className="text-textSecondary">7. Constraint Compliance</span>
                <StatusBadge status="met" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
