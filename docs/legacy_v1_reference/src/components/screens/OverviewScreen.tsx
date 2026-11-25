import React from 'react';
import { useTokenOS } from '../../context/TokenOSContext';
import { Button } from '../common/Button';
import { MetricCard } from '../common/MetricCard';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { DataTable, Column } from '../common/DataTable';
import { Run } from '../../types';
import {
  Play,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Cpu,
  Brain,
  Sparkles,
  Wrench,
  ShieldCheck,
  ServerOff
} from 'lucide-react';

export const OverviewScreen: React.FC = () => {
  const {
    historyRuns,
    startDemoScenario,
    resetDraft,
    loadRunIntoWorkspace,
    setActiveScreen
  } = useTokenOS();

  const totalRuns = historyRuns.length;
  const runsNeedingReview = historyRuns.filter(
    (r) => r.status === 'needs_review' || r.verificationReports.some((v) => v.overallStatus === 'failed')
  ).length;

  const columns: Column<Run>[] = [
    {
      key: 'title',
      header: 'Request Title',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-textPrimary">{r.title}</div>
          <div className="text-[11px] font-mono text-textMuted truncate max-w-xs">{r.originalRequest.slice(0, 60)}...</div>
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
      header: 'Model / Provider',
      render: (r) => (
        <span className="font-mono text-[11px] text-textSecondary">
          {r.config.model}
        </span>
      )
    },
    {
      key: 'usage',
      header: 'Tokens & Cost',
      render: (r) => {
        const usage = r.usageHistory[0];
        if (!usage) return <span className="text-textMuted">--</span>;
        return (
          <div className="font-mono text-[11px]">
            <div>{(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens</div>
            <div className="text-textMuted">${usage.costUsd.toFixed(4)} ({usage.provenance})</div>
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
      key: 'action',
      header: 'Inspect',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadRunIntoWorkspace(r.id);
          }}
          className="text-xs text-accent hover:text-accentHover font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="surface-card p-6 border-l-4 border-l-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-textPrimary tracking-tight">
              AI execution, made understandable.
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent/20 text-accent border border-accent/40 font-semibold">
              TokenOS Control Plane
            </span>
          </div>
          <p className="text-xs text-textSecondary max-w-2xl leading-relaxed">
            Understand the request. Choose a proportionate execution plan. Check the result. Improve only when worthwhile.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            icon={<Zap className="w-4 h-4 text-warning" />}
            onClick={startDemoScenario}
          >
            Launch E2E Demo Scenario
          </Button>
          <Button
            variant="primary"
            icon={<Play className="w-4 h-4" />}
            onClick={resetDraft}
          >
            Start a Request
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Runs Today"
          value={totalRuns}
          subtext="Executed under active workspace"
          icon={<Activity className="w-4 h-4" />}
          badge={{ status: 'DEMO', label: 'DEMO MODE' }}
          provenance="Synthetic demo run counter"
        />
        <MetricCard
          label="Avg Latency"
          value="3.05s"
          subtext="Measured pipeline time"
          icon={<Clock className="w-4 h-4" />}
          badge={{ status: 'Estimated', label: 'Measured' }}
          provenance="Pipeline timer fixture"
        />
        <MetricCard
          label="Tokens & Cost"
          value="2,894 tok"
          subtext="$0.0189 total demo usage"
          icon={<Database className="w-4 h-4" />}
          badge={{ status: 'Estimated', label: 'Demo Rate Card' }}
          provenance="$3/M in, $12/M out demo rate"
        />
        <MetricCard
          label="Needing Review"
          value={runsNeedingReview}
          subtext="Unverified or failed criteria"
          icon={<CheckCircle2 className="w-4 h-4" />}
          badge={{ status: runsNeedingReview > 0 ? 'needs_review' : 'completed' }}
          provenance="Contract verifier"
        />
      </div>

      {/* How TokenOS Works 4-Step Guide */}
      <Card title="How TokenOS Works — 4-Stage Control Workflow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveScreen('Understand Request')}
            className="p-4 rounded-card bg-bgDeep border border-borderColor hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-accent font-bold">01. Understand</span>
              <Brain className="w-4 h-4 text-textMuted group-hover:text-accent" />
            </div>
            <h4 className="text-xs font-semibold text-textPrimary">Intent Contract</h4>
            <p className="text-[11px] text-textSecondary mt-1">
              Extract explicit objective, deliverable, constraints, assumptions, and success criteria.
            </p>
          </div>

          <div
            onClick={() => setActiveScreen('Optimize Request')}
            className="p-4 rounded-card bg-bgDeep border border-borderColor hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-accent font-bold">02. Optimize</span>
              <Sparkles className="w-4 h-4 text-textMuted group-hover:text-accent" />
            </div>
            <h4 className="text-xs font-semibold text-textPrimary">Prompt Engineering</h4>
            <p className="text-[11px] text-textSecondary mt-1">
              Structure prompts for maximum clarity, enforce schemas, and calculate token estimates.
            </p>
          </div>

          <div
            onClick={() => setActiveScreen('AI Execution')}
            className="p-4 rounded-card bg-bgDeep border border-borderColor hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-accent font-bold">03. Execute</span>
              <Play className="w-4 h-4 text-textMuted group-hover:text-accent" />
            </div>
            <h4 className="text-xs font-semibold text-textPrimary">Pipeline Control</h4>
            <p className="text-[11px] text-textSecondary mt-1">
              Apply policies, context strategies, reasoning budgets, and trace tool calls.
            </p>
          </div>

          <div
            onClick={() => setActiveScreen('Check Answer')}
            className="p-4 rounded-card bg-bgDeep border border-borderColor hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-accent font-bold">04. Check & Improve</span>
              <Wrench className="w-4 h-4 text-textMuted group-hover:text-accent" />
            </div>
            <h4 className="text-xs font-semibold text-textPrimary">Contract Verification</h4>
            <p className="text-[11px] text-textSecondary mt-1">
              Audit against criteria, evaluate iteration value, and run targeted refinements.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Grid: Recent Runs Table & Provider Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Recent Execution Runs"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveScreen('Execution History')}
              >
                View All History
              </Button>
            }
          >
            <DataTable
              columns={columns}
              data={historyRuns}
              onRowClick={(r) => loadRunIntoWorkspace(r.id)}
              getRowId={(r) => r.id}
            />
          </Card>
        </div>

        {/* Integration Status Panel */}
        <div className="space-y-4">
          <Card title="Provider & MCP Connections">
            <div className="space-y-3">
              <div className="p-3 bg-bgDeep rounded-md border border-borderColor flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-accent" />
                  <div>
                    <div className="text-xs font-semibold text-textPrimary">Demo Provider (Simulated)</div>
                    <div className="text-[10px] font-mono text-textMuted">Deterministic fixture engine</div>
                  </div>
                </div>
                <StatusBadge status="DEMO" label="Active" />
              </div>

              <div className="p-3 bg-bgDeep rounded-md border border-borderColor flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ServerOff className="w-4 h-4 text-textMuted" />
                  <div>
                    <div className="text-xs font-semibold text-textSecondary">OpenAI / Anthropic Direct API</div>
                    <div className="text-[10px] font-mono text-textMuted">No live API key connected</div>
                  </div>
                </div>
                <StatusBadge status="Unavailable" />
              </div>

              <div className="p-3 bg-bgDeep rounded-md border border-borderColor flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <div>
                    <div className="text-xs font-semibold text-textPrimary">MCP File & Calc Verifier</div>
                    <div className="text-[10px] font-mono text-textMuted">Local demo tools active</div>
                  </div>
                </div>
                <StatusBadge status="LIVE" label="Connected" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
