import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { DiffView } from '../common/DiffView';
import { ProvenanceNote } from '../common/ProvenenceNote';
import { ChecklistItem } from '../common/ChecklistItem';
import {
  Wrench,
  CheckCircle2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AnswerVersion, VerificationReport } from '../../types';

export const ImproveAnswerScreen: React.FC = () => {
  const { activeRun, setActiveRun, setActiveScreen, showToast, saveCurrentRun } = useTokenOS();
  const [isRefining, setIsRefining] = useState(false);

  const activeAnswer = activeRun.answers[activeRun.answers.length - 1];
  const previousAnswer = activeRun.answers.length > 1 ? activeRun.answers[activeRun.answers.length - 2] : null;
  const activeReport = activeRun.verificationReports.find((r) => r.answerVersionId === activeAnswer?.id) || activeRun.verificationReports[0];

  const iterationCount = activeRun.iterationCount;
  const maxIterations = activeRun.maxIterations;

  const isLimitReached = iterationCount >= maxIterations;
  const isFullyPassed = activeReport?.overallStatus === 'passed';

  const handleRunRefinement = () => {
    if (isLimitReached) {
      showToast('Maximum iteration limit of 1 reached.');
      return;
    }

    setIsRefining(true);
    showToast('Executing bounded refinement (Iteration 1)...');

    setTimeout(() => {
      setIsRefining(false);

      const nextAnswerNum = activeRun.answers.length + 1;
      const refinedAnswerContent =
        `Total sales were flat month over month: $1,600K in August and $1,600K in September (0.0%). The mix shifted between regions.\n` +
        `- North: $420K to $462K (+10.0%)\n` +
        `- East: $510K to $535K (+4.9%)\n` +
        `- South: $380K to $342K (−10.0%)\n` +
        `- West: $290K to $261K (−10.0%)\n` +
        `Takeaway: gains in North and East were offset by declines in South and West. The data does not show the cause of these changes.`;

      const newAnswer: AnswerVersion = {
        id: `ans-v${nextAnswerNum}`,
        versionNumber: nextAnswerNum,
        content: refinedAnswerContent,
        parentId: activeAnswer?.id,
        iteration: 1,
        createdAt: new Date().toISOString()
      };

      const newReport: VerificationReport = {
        id: `rep-v${nextAnswerNum}`,
        answerVersionId: newAnswer.id,
        contractVersion: activeRun.contract.version,
        overallStatus: 'passed',
        limitations: 'Cause of regional changes: not evaluated, no supporting data supplied.',
        findings: [
          {
            id: 'f-1-v2',
            criterionCode: 'b',
            criterionText: 'states the total change correctly',
            status: 'met',
            severity: 'low',
            checkType: 'Deterministic check',
            detail: 'Total change accurately stated as $1,600K to $1,600K (0.0%).',
            evidenceExcerpt: 'Total sales were flat month over month: $1,600K in August and $1,600K in September (0.0%).'
          },
          {
            id: 'f-2-v2',
            criterionCode: 'a',
            criterionText: 'covers every region',
            status: 'met',
            severity: 'low',
            checkType: 'Deterministic check',
            detail: 'All 4 regions (North, East, South, West) included with exact numbers and % changes.',
            evidenceExcerpt: '- North: $420K to $462K (+10.0%)\n- East: $510K to $535K (+4.9%)\n- South: $380K to $342K (−10.0%)\n- West: $290K to $261K (−10.0%)'
          },
          {
            id: 'f-3-v2',
            criterionCode: 'c',
            criterionText: 'every claim is supported by the table',
            status: 'met',
            severity: 'low',
            checkType: 'Model-based judgment',
            detail: 'No unsupported claims. Cause of regional changes explicitly noted as not evaluated/unsupplied.',
            evidenceExcerpt: 'The data does not show the cause of these changes.'
          },
          {
            id: 'f-4-v2',
            criterionCode: 'd',
            criterionText: 'concise enough for a team update',
            status: 'met',
            severity: 'low',
            checkType: 'Model-based judgment',
            detail: 'Concise bulleted summary suitable for team dissemination.',
            evidenceExcerpt: 'Takeaway: gains in North and East were offset by declines in South and West.'
          }
        ]
      };

      setActiveRun((prev) => ({
        ...prev,
        answers: [...prev.answers, newAnswer],
        verificationReports: [...prev.verificationReports, newReport],
        iterationCount: prev.iterationCount + 1,
        stopReason: 'Stopped: issues resolved and the iteration limit of 1 was reached.',
        usageHistory: [
          ...prev.usageHistory,
          {
            isDemo: true,
            provenance: 'DEMO, synthetic',
            inputTokens: 1610,
            outputTokens: 438,
            durationSec: 2.9,
            costUsd: 0.0101,
            rateCardNote: 'demo rate card, not a real provider price ($3 per million input, $12 per million output)'
          }
        ]
      }));

      saveCurrentRun();
      showToast('Answer v2 produced & re-checked! All criteria passed.');
    }, 1000);
  };

  const handleStopAndKeep = () => {
    setActiveRun((prev) => ({
      ...prev,
      stopReason: 'Stopped by user: accepted current answer version.'
    }));
    saveCurrentRun();
    showToast('Run completed and saved to history.');
    setActiveScreen('Execution History');
  };

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              Improve Answer — Cost-Aware Bounded Refinement
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              Iteration {iterationCount} of {maxIterations}
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Decide whether a targeted refinement is worth the extra time and cost, then optionally perform one bounded revision.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveScreen('Check Answer')}
          >
            Return to Check Answer
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={handleStopAndKeep}
          >
            Finish & Save Run
          </Button>
        </div>
      </div>

      {/* Value of Iteration Decision Panel (Hero Decision Box) */}
      <div className="surface-card p-6 border-2 border-accent bg-accentTint/15 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <span>Value of Iteration Analysis</span>
          </div>
          <StatusBadge
            status={isFullyPassed ? 'completed' : 'needs_review'}
            label={isFullyPassed ? 'Recommendation: STOP (Issues Resolved)' : 'Recommendation: IMPROVE'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-surface rounded border border-borderColor">
            <span className="text-textMuted block mb-1">Expected Quality Gain</span>
            <span className="text-sm font-bold text-success">HIGH (3 criteria fixable)</span>
          </div>
          <div className="p-3 bg-surface rounded border border-borderColor">
            <span className="text-textMuted block mb-1">Est. Additional Cost & Tokens</span>
            <span className="text-sm font-mono font-bold text-textPrimary">1,610 tok (~$0.0101)</span>
          </div>
          <div className="p-3 bg-surface rounded border border-borderColor">
            <span className="text-textMuted block mb-1">Est. Additional Latency</span>
            <span className="text-sm font-mono font-bold text-textPrimary">2.9s</span>
          </div>
          <div className="p-3 bg-surface rounded border border-borderColor">
            <span className="text-textMuted block mb-1">Risk to Correct Content</span>
            <span className="text-sm font-bold text-info">LOW (Isolated data fixes)</span>
          </div>
        </div>

        <div className="p-3 bg-surface rounded border border-borderColor text-xs space-y-1">
          <span className="font-semibold text-textPrimary">Plain-Language Rationale:</span>
          <p className="text-textSecondary leading-relaxed">
            {isFullyPassed
              ? 'Stopped: all success criteria are met and the iteration limit of 1 was reached.'
              : 'The two failed criteria (total change 0.0% and missing South/West regions) are objective facts fixable with the supplied data. One targeted refinement is within budget.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <ProvenanceNote text="Demo quote from synthetic rate card ($3/M in, $12/M out)." isDemo />

          {!isFullyPassed && !isLimitReached && (
            <Button
              variant="primary"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRunRefinement}
              disabled={isRefining}
            >
              {isRefining ? 'Refining...' : 'Apply 1 Bounded Refinement'}
            </Button>
          )}
        </div>
      </div>

      {/* Repair Plan & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Targeted Repair Plan */}
        <Card title="Targeted Repair Plan (Issue → Change → Benefit)">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
              <div className="flex items-center justify-between font-semibold text-textPrimary">
                <span>Issue #1: Incorrect Total Change</span>
                <StatusBadge status="not_met" />
              </div>
              <p className="text-textSecondary">Proposed Change: Recompute total sum as $1,600K vs $1,600K (0.0% change).</p>
              <p className="text-success font-medium">Expected Benefit: Satisfies Criterion (b).</p>
            </div>

            <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
              <div className="flex items-center justify-between font-semibold text-textPrimary">
                <span>Issue #2: Omitted Regions</span>
                <StatusBadge status="not_met" />
              </div>
              <p className="text-textSecondary">Proposed Change: Explicitly list South (−10.0%) and West (−10.0%).</p>
              <p className="text-success font-medium">Expected Benefit: Satisfies Criterion (a).</p>
            </div>

            <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
              <div className="flex items-center justify-between font-semibold text-textPrimary">
                <span>Issue #3: Speculative Campaign Claim</span>
                <StatusBadge status="not_met" />
              </div>
              <p className="text-textSecondary">Proposed Change: Remove "thanks to the new regional campaign" speculation.</p>
              <p className="text-success font-medium">Expected Benefit: Satisfies Criterion (c).</p>
            </div>
          </div>
        </Card>

        {/* Right Column: Re-Check Verification Results */}
        <Card title="Post-Refinement Verification Re-Check">
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
                />
              ))
            ) : (
              <p className="text-xs text-textMuted">Run refinement to inspect updated findings.</p>
            )}

            {activeRun.stopReason && (
              <div className="p-3 bg-bgDeep rounded border border-borderColor text-xs font-mono text-accent">
                {activeRun.stopReason}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Answer Versions Comparison (v1 vs v2 Diff) */}
      {previousAnswer && (
        <Card title="Before vs After Version Comparison (Answer v1 vs Answer v2)">
          <DiffView
            originalLabel="Answer v1 (Flawed Initial Output)"
            originalText={previousAnswer.content}
            modifiedLabel="Answer v2 (Refined Output)"
            modifiedText={activeAnswer.content}
            changeSummary="Fixed total change calculation to 0.0%, included missing South and West regions, and stripped speculative campaign claim."
          />
        </Card>
      )}
    </div>
  );
};
