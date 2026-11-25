import React, { useState } from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { Tabs } from '../common/Tabs';
import { CodeBlock } from '../common/CodeBlock';
import { ChecklistItem } from '../common/ChecklistItem';
import {
  History,
  Eye,
  Copy
} from 'lucide-react';
import { Run } from '../../types';

export const ExecutionHistoryScreen: React.FC = () => {
  const { historyRuns, setActiveRun, setActiveScreen, showToast } = useTokenOS();
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [activeTab, setActiveTab] = useState('contract');

  const columns: Column<Run>[] = [
    {
      key: 'title',
      header: 'Request Name',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-textPrimary">{r.title}</div>
          <div className="text-[11px] font-mono text-textMuted">{r.id} • {new Date(r.createdAt).toLocaleString()}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: 'provider',
      header: 'Provider & Model',
      render: (r) => (
        <span className="font-mono text-[11px] text-textSecondary">
          {r.config.model}
        </span>
      )
    },
    {
      key: 'usage',
      header: 'Usage & Cost',
      render: (r) => {
        const usage = r.usageHistory[r.usageHistory.length - 1];
        if (!usage) return <span className="text-textMuted">--</span>;
        return (
          <div className="font-mono text-[11px]">
            <div>{(usage.inputTokens + usage.outputTokens).toLocaleString()} tok</div>
            <div className="text-textMuted">${usage.costUsd.toFixed(4)}</div>
          </div>
        );
      }
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (r) => {
        const lastRep = r.verificationReports[r.verificationReports.length - 1];
        if (!lastRep) return <StatusBadge status="not_evaluated" />;
        return <StatusBadge status={lastRep.overallStatus} />;
      }
    },
    {
      key: 'iterations',
      header: 'Iterations',
      render: (r) => (
        <span className="font-mono text-xs text-textSecondary">
          {r.iterationCount} / {r.maxIterations}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Inspect',
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRun(r);
          }}
        >
          Details
        </Button>
      )
    }
  ];

  const handleDuplicateDraft = (r: Run) => {
    const duplicated: Run = JSON.parse(JSON.stringify(r));
    duplicated.id = `run-${Date.now().toString().slice(-4)}`;
    duplicated.createdAt = new Date().toISOString();
    duplicated.title = `${r.title} (Copy)`;
    setActiveRun(duplicated);
    setSelectedRun(null);
    showToast('Duplicated run into workspace draft');
    setActiveScreen('Understand Request');
  };

  const detailTabs = [
    { id: 'contract', label: '1. Intent Contract' },
    { id: 'prompts', label: '2. Prompts' },
    { id: 'config', label: '3. Execution Config' },
    { id: 'timeline', label: '4. Pipeline Trace' },
    { id: 'tools', label: '5. Tool Calls' },
    { id: 'answers', label: '6. Answer Versions' },
    { id: 'findings', label: '7. Verification' },
    { id: 'provenance', label: '8. Usage Provenance' },
  ];

  return (
    <div className="space-y-6">
      {/* Screen Banner */}
      <div className="surface-card p-5 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-textPrimary">
              Execution History & Audit Log
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent font-semibold">
              {historyRuns.length} Persistent Runs
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Searchable, filterable audit log of historical runs, intent contracts, prompt versions, pipeline events, and cost provenance.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <Card title="Saved Execution Log">
        <DataTable
          columns={columns}
          data={historyRuns}
          onRowClick={(r) => setSelectedRun(r)}
          getRowId={(r) => r.id}
          searchPlaceholder="Search runs by title, ID, or prompt..."
        />
      </Card>

      {/* Detail Inspection Modal */}
      {selectedRun && (
        <Modal
          isOpen={!!selectedRun}
          onClose={() => setSelectedRun(null)}
          title={
            <div className="flex items-center gap-3">
              <span>{selectedRun.title}</span>
              <StatusBadge status={selectedRun.mode === 'demo' ? 'DEMO' : 'LIVE'} />
              <StatusBadge status={selectedRun.status} />
            </div>
          }
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => handleDuplicateDraft(selectedRun)}
              >
                Duplicate as New Draft
              </Button>
              <Button size="sm" variant="primary" onClick={() => setSelectedRun(null)}>
                Close Detail
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Tabs
              tabs={detailTabs}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab)}
            />

            {/* Tab 1: Contract */}
            {activeTab === 'contract' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-bgDeep rounded border border-borderColor">
                  <span className="font-semibold text-textSecondary block mb-1">Original Request:</span>
                  <pre className="font-mono text-textPrimary whitespace-pre-wrap">{selectedRun.originalRequest}</pre>
                </div>
                <div className="p-3 bg-bgDeep rounded border border-borderColor space-y-1">
                  <span className="font-semibold text-textSecondary">Objective:</span> {selectedRun.contract.objective}<br />
                  <span className="font-semibold text-textSecondary">Deliverable:</span> {selectedRun.contract.deliverable}<br />
                  <span className="font-semibold text-textSecondary">Constraints:</span> {selectedRun.contract.constraints.join('; ')}
                </div>
              </div>
            )}

            {/* Tab 2: Prompts */}
            {activeTab === 'prompts' && (
              <div className="space-y-3">
                {selectedRun.prompts.map((p) => (
                  <CodeBlock
                    key={p.id}
                    title={`Prompt v${p.versionNumber} (${p.source}) — ${p.estimatedTokenCount || 0} tokens`}
                    code={p.content}
                  />
                ))}
              </div>
            )}

            {/* Tab 3: Config */}
            {activeTab === 'config' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-bgDeep rounded border border-borderColor">
                  <span className="font-semibold text-textSecondary">Provider & Model:</span>
                  <div className="font-mono text-textPrimary mt-1">{selectedRun.config.provider} ({selectedRun.config.model})</div>
                </div>
                <div className="p-3 bg-bgDeep rounded border border-borderColor">
                  <span className="font-semibold text-textSecondary">Policy & Budget:</span>
                  <div className="font-mono text-textPrimary mt-1">
                    Max Output: {selectedRun.config.maxOutputTokens} tok | Cost Cap: ${selectedRun.config.costLimitUsd}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-2">
                {selectedRun.pipelineEvents.map((e, idx) => (
                  <div key={idx} className="p-2.5 bg-bgDeep rounded border border-borderColor flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-accent font-bold">[{e.stage}]</span> {e.eventType}: {e.detail}
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Tools */}
            {activeTab === 'tools' && (
              <div className="space-y-2">
                {selectedRun.toolCalls.map((tc) => (
                  <div key={tc.id} className="p-3 bg-bgDeep rounded border border-borderColor text-xs font-mono">
                    <div className="text-accent font-bold">{tc.toolName} ({tc.status})</div>
                    <div className="text-textSecondary mt-1">In: {tc.input}</div>
                    <div className="text-success mt-0.5">Out: {tc.output}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 6: Answers */}
            {activeTab === 'answers' && (
              <div className="space-y-3">
                {selectedRun.answers.map((ans) => (
                  <CodeBlock
                    key={ans.id}
                    title={`Answer v${ans.versionNumber} (Iteration ${ans.iteration})`}
                    code={ans.content}
                  />
                ))}
              </div>
            )}

            {/* Tab 7: Findings */}
            {activeTab === 'findings' && (
              <div className="space-y-3">
                {selectedRun.verificationReports.map((rep) => (
                  <div key={rep.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-textPrimary">Report for Answer {rep.answerVersionId}</span>
                      <StatusBadge status={rep.overallStatus} />
                    </div>
                    {rep.findings.map((f) => (
                      <ChecklistItem
                        key={f.id}
                        code={f.criterionCode}
                        text={f.criterionText}
                        status={f.status}
                        severity={f.severity}
                        checkType={f.checkType}
                        detail={f.detail}
                        evidenceExcerpt={f.evidenceExcerpt}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 8: Usage Provenance */}
            {activeTab === 'provenance' && (
              <div className="space-y-3 text-xs">
                {selectedRun.usageHistory.map((u, idx) => (
                  <div key={idx} className="p-3 bg-bgDeep rounded border border-borderColor space-y-1 font-mono">
                    <div className="flex items-center justify-between text-textPrimary font-bold">
                      <span>Usage Record #{idx + 1}</span>
                      <StatusBadge status={u.isDemo ? 'DEMO' : 'LIVE'} label={u.provenance} />
                    </div>
                    <div className="text-textSecondary">
                      Input Tokens: {u.inputTokens} | Output Tokens: {u.outputTokens} | Duration: {u.durationSec}s
                    </div>
                    <div className="text-accent font-bold">Cost: ${u.costUsd.toFixed(4)}</div>
                    <div className="text-[11px] text-textMuted">Note: {u.rateCardNote}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
