import React, { useState, useMemo } from 'react';
import { ExecutionRun, AnomalyEvent } from '../../types';
import { detectZScoreAnomalies } from '../../services/mlEngine';
import { exportAuditReportJson, clearAllRuns } from '../../services/storageService';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Cpu, 
  Sparkles,
  Zap,
  Trash2
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface RunsInsightsScreenProps {
  runsHistory: ExecutionRun[];
  onSelectRun: (run: ExecutionRun) => void;
}

export const RunsInsightsScreen: React.FC<RunsInsightsScreenProps> = ({
  runsHistory,
  onSelectRun
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [frontierAxis, setFrontierAxis] = useState<'tokens' | 'cost'>('tokens');

  // Exclude idle placeholder run-tk-ready from audit & statistical analysis
  const realRuns = useMemo(() => {
    return runsHistory.filter(r => r.id !== 'run-tk-ready');
  }, [runsHistory]);

  const auditSummary = useMemo(() => {
    const count = realRuns.length;
    const totalTokens = realRuns.reduce((s, r) => s + (r.totalTokens || 0), 0);
    const totalCost = realRuns.reduce((s, r) => s + (r.totalCostUsd || 0), 0);
    const readyCount = realRuns.filter(r => r.status === 'READY').length;
    const passRate = count > 0 ? Math.round((readyCount / count) * 100) : 0;
    return { count, totalTokens, totalCost, passRate };
  }, [realRuns]);

  const latestAnomaly: AnomalyEvent | null = useMemo(() => {
    if (realRuns.length < 3) return null;
    for (const r of realRuns) {
      const anom = detectZScoreAnomalies(r, realRuns);
      if (anom) return anom;
    }
    return null;
  }, [realRuns]);

  // Prepare Pareto Frontier Benchmark Data (with safe NaN guard)
  const paretoData = useMemo(() => realRuns.map((r) => {
    const reqs = r.requirementEvaluations || [];
    const quality = reqs.length > 0
      ? reqs.filter((e) => e.status === 'SATISFIED').length / reqs.length
      : (r.status === 'READY' ? 1.0 : 0.0);
    return {
      name: r.id,
      cost: r.totalCostUsd || 0,
      tokens: r.totalTokens || 0,
      quality: Number(quality.toFixed(2)),
      latency: r.totalLatencyMs || 0,
      provider: r.providerModel,
    };
  }), [realRuns]);

  const filteredRuns = realRuns.filter((r) => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || r.providerModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportTrace = (run: ExecutionRun) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tokenos_trace_${run.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 slate-glass-card p-5 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D97757]" />
            <h1 className="text-xl font-bold font-mono text-slate-100">
              Audit & Trace Logs — Execution History & Records
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete reproducible execution traces, token usage breakdown, model selection records, and verification audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {runsHistory.length > 0 && (
            <button
              onClick={() => clearAllRuns()}
              className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-800/80 font-mono font-bold px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              title="Delete all saved execution runs and benchmark trails"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>PURGE ALL TRAILS</span>
            </button>
          )}

          <button
            onClick={() => {
              const sampleContract = { id: 'contract-fac-latest', version: 1, title: 'Enterprise SLA Compliance Audit', requirements: ['Determinism', 'Zero Data Leak', 'SLA Verified'] } as any;
              exportAuditReportJson(runsHistory, sampleContract);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT COMPLIANCE AUDIT REPORT</span>
          </button>
        </div>
      </div>

      {/* Audit KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="slate-glass-card p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10.5px] text-slate-400">Audited Traces</div>
          <div className="text-xl font-bold text-slate-100 mt-0.5">{auditSummary.count}</div>
        </div>
        <div className="slate-glass-card p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10.5px] text-slate-400">Total Audited Tokens</div>
          <div className="text-xl font-bold text-amber-400 mt-0.5">{auditSummary.totalTokens.toLocaleString()}</div>
        </div>
        <div className="slate-glass-card p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10.5px] text-slate-400">Total Audited Cost</div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">${auditSummary.totalCost.toFixed(4)}</div>
        </div>
        <div className="slate-glass-card p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10.5px] text-slate-400">Clean Verification Rate</div>
          <div className="text-xl font-bold text-[#E2896B] mt-0.5">{auditSummary.passRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pareto Quality vs Tokens / Cost Frontier */}
        <div className="lg:col-span-7 slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="font-mono text-sm font-semibold text-[#E2896B] flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Quality vs {frontierAxis === 'tokens' ? 'Token Efficiency' : 'Cost'} Pareto Frontier
            </h2>
            <div className="flex items-center gap-2 font-mono text-[10.5px]">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => setFrontierAxis('tokens')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${frontierAxis === 'tokens' ? 'bg-[#D97757] text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Tokens
                </button>
                <button
                  type="button"
                  onClick={() => setFrontierAxis('cost')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${frontierAxis === 'cost' ? 'bg-[#D97757] text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Cost ($)
                </button>
              </div>
              <span className="text-slate-500 hidden sm:inline">Optimal: Top-Left</span>
            </div>
          </div>

          <div className="h-[240px] w-full pt-2">
            {paretoData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs font-mono text-slate-400 border border-dashed border-slate-800 rounded-lg p-4">
                <Sparkles className="w-7 h-7 text-slate-600 mb-2" />
                <p>No audited runs yet. Execute a task to plot the Pareto frontier.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 15, bottom: 20, left: 10 }}>
                  <XAxis 
                    type="number" 
                    dataKey={frontierAxis} 
                    name={frontierAxis === 'tokens' ? 'Total Tokens' : 'Cost ($)'} 
                    unit={frontierAxis === 'tokens' ? ' tok' : '$'} 
                    stroke="#7E8B9B" 
                    tick={{ fontSize: 10, fill: '#7E8B9B' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="quality" 
                    name="Quality Ratio" 
                    domain={[0, 1]} 
                    stroke="#7E8B9B" 
                    tick={{ fontSize: 10, fill: '#7E8B9B' }}
                  />
                  <ZAxis type="number" dataKey="latency" range={[70, 220]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-2.5 rounded font-mono text-xs space-y-1 shadow-xl">
                            <div className="font-bold text-[#E2896B]">{data.name}</div>
                            <div className="text-slate-400 text-[10px]">{data.provider}</div>
                            <div>Tokens: <strong className="text-amber-400">{data.tokens}</strong></div>
                            <div>Cost: <strong className="text-emerald-400">${data.cost.toFixed(4)}</strong></div>
                            <div>Quality: <strong className="text-slate-100">{(data.quality * 100).toFixed(0)}%</strong></div>
                            <div>Latency: <strong className="text-blue-300">{data.latency}ms</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Execution Runs" data={paretoData}>
                    {paretoData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.quality >= 0.9 ? '#22C55E' : entry.quality >= 0.5 ? '#D97757' : '#EF4444'} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operational Anomaly Event Logger */}
        <div className="lg:col-span-5 slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-mono text-sm font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Statistical Anomaly Attribution
            </h2>
            <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
              Threshold: |Z| ≥ 2.5σ
            </span>
          </div>

          {latestAnomaly ? (
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-amber-400 font-bold">EVENT #{latestAnomaly.id}</span>
                <span className="text-slate-500 text-[10px]">{new Date(latestAnomaly.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="text-slate-200">
                Anomaly Type: <span className="text-red-400 font-bold">{latestAnomaly.anomalyType.replace(/_/g, ' ').toUpperCase()}</span> (|Z| = {latestAnomaly.score}σ)
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block">9-Feature Attribution Weights:</span>
                {latestAnomaly.featureAttribution.map((f, i) => {
                  const formattedZ = f.zScore > 0 ? `+${f.zScore}` : `${f.zScore}`;
                  const barPct = Math.min(100, Math.round((Math.abs(f.zScore) / 4) * 100));
                  return (
                    <div key={i} className="space-y-0.5 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>{f.feature}</span>
                        <span className={`font-bold ${Math.abs(f.zScore) >= 2.5 ? 'text-rose-400' : 'text-amber-400'}`}>
                          Z: {formattedZ}σ
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${Math.abs(f.zScore) >= 2.5 ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Operational Anomalies (|Z| &lt; 2.5σ)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {realRuns.length < 3
                  ? `Gathering baseline telemetry traces (${realRuns.length}/3 runs recorded). Rolling 9-feature Z-score detector active.`
                  : `All ${realRuns.length} audited execution traces operate within calibrated SLA bounds.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Execution Trace Search & Table */}
      <div className="slate-glass-card rounded-xl p-5 border border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="font-mono text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E2896B]" /> Search Execution History & Reproducible Traces
          </h2>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search run ID, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:border-[#D97757] focus:outline-none"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">READY</option>
              <option value="NEEDS_IMPROVEMENT">NEEDS_IMPROVEMENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRuns.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-slate-800 text-center space-y-2">
              <Clock className="w-6 h-6 text-slate-500 mx-auto" />
              <div className="text-sm font-mono text-slate-300 font-bold">
                No Execution Runs Recorded Yet
              </div>
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                Execute tasks from the Workbench to view detailed execution traces, token provenance, and audit logs here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-900/60">
                  <th className="p-2.5">Run ID</th>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">AI Model</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-center">Tokens</th>
                  <th className="p-2.5 text-center">Latency</th>
                  <th className="p-2.5 text-center">Verification</th>
                  <th className="p-2.5 text-center">Repairs</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRuns.map((r) => {
                  const satisfiedCount = (r.requirementEvaluations || []).filter(e => e.status === 'SATISFIED').length;
                  const totalReqCount = (r.requirementEvaluations || []).length;

                  return (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td 
                        onClick={() => onSelectRun(r)}
                        className="p-2.5 font-bold text-[#E2896B] hover:underline cursor-pointer"
                        title="Click to view run in Execution Control"
                      >
                        {r.id}
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 text-slate-200">
                        {r.providerModel}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'READY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          r.status === 'NEEDS_IMPROVEMENT' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-slate-300">
                        {r.totalTokens}
                        {r.inputTokens !== undefined && (
                          <span className="text-[10px] text-slate-500 block">
                            {r.inputTokens} in / {r.outputTokens || 0} out
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center text-emerald-400">
                        {r.totalLatencyMs}ms
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-slate-300 text-[11px]">
                          {totalReqCount > 0 ? `${satisfiedCount}/${totalReqCount} Passed` : 'Standard'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {r.repairAttempts && r.repairAttempts > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold">
                            {r.repairAttempts} Fixed
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">0</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleExportTrace(r)}
                          className="text-slate-400 hover:text-[#E2896B] p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Export Trace JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
