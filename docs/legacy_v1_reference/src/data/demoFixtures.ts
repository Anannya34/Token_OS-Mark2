import { Run } from '../types';

export const SYNTHETIC_SALES_TABLE = `| Region | August | September | Change |
|---|---|---|---|
| North | 420 | 462 | +42 (+10.0%) |
| South | 380 | 342 | −38 (−10.0%) |
| East | 510 | 535 | +25 (+4.9%) |
| West | 290 | 261 | −29 (−10.0%) |
| **Total** | **1,600** | **1,600** | **0 (0.0%)** |`;

export const INITIAL_DEMO_RUN: Run = {
  id: 'run-demo-001',
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  status: 'completed',
  mode: 'demo',
  title: 'Monthly Sales Regional Breakdown & Summary',
  originalRequest: `Look at these sales numbers, tell me what changed, and make a useful summary for my team.\n\n` + SYNTHETIC_SALES_TABLE,
  contract: {
    objective: 'Explain what changed between August and September sales figures',
    deliverable: 'Short written summary suitable for team update',
    audience: 'Internal sales team & stakeholders',
    constraints: [
      'Rely strictly on provided table numbers',
      'Include figures for all regions',
      'State total change accurately'
    ],
    assumptions: [
      {
        id: 'asm-1',
        text: 'Assumption: compare September to August, month over month.',
        accepted: true
      }
    ],
    ambiguities: [
      'Which exact periods to compare (assumed August vs September)'
    ],
    successCriteria: [
      { id: 'crit-a', code: 'a', text: 'covers every region' },
      { id: 'crit-b', code: 'b', text: 'states the total change correctly' },
      { id: 'crit-c', code: 'c', text: 'every claim is supported by the table' },
      { id: 'crit-d', code: 'd', text: 'concise enough for a team update' }
    ],
    outputFormat: 'Summary with key numbers (Markdown)',
    version: 1
  },
  prompts: [
    {
      id: 'prompt-v1',
      versionNumber: 1,
      content: `Look at these sales numbers, tell me what changed, and make a useful summary for my team.\n\n` + SYNTHETIC_SALES_TABLE,
      format: 'plain',
      source: 'original',
      createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      selected: false,
      estimatedTokenCount: 840,
      tokenizerProvenance: 'cl100k_base tokenizer estimate'
    },
    {
      id: 'prompt-v2',
      versionNumber: 2,
      content: `Analyze the provided sales data table comparing August and September sales.\n1. State the overall total change across both months.\n2. Explicitly cover all four regions (North, South, East, West) with their respective figures and percentage changes.\n3. Provide a concise takeaway summary for the team.\n4. Strictly do NOT include any unverified external claims, campaign explanations, or speculative reasons not present in the data.`,
      format: 'markdown',
      source: 'optimized',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      selected: true,
      estimatedTokenCount: 1284,
      tokenizerProvenance: 'cl100k_base tokenizer estimate',
      changeSummary: 'Structured requirements to enforce total calculation, 4-region coverage, and ban speculative campaign claims.'
    }
  ],
  activePromptId: 'prompt-v2',
  config: {
    provider: 'Demo Provider (Simulated)',
    model: 'Demo Model Profile (Simulated)',
    contextStrategy: 'Full context window',
    toolPermissions: ['MCP File Reader', 'MCP Calc'],
    outputFormat: 'Markdown Summary',
    timeoutSec: 30,
    retryPolicy: 'Standard (max 3 retries)',
    reasoningEffort: 'medium',
    maxOutputTokens: 2048,
    costLimitUsd: 0.50
  },
  pipelineEvents: [
    {
      runId: 'run-demo-001',
      stage: 'Intent',
      eventType: 'Contract Validation',
      timestamp: '03:45:01',
      status: 'success',
      detail: 'Intent contract approved with 1 accepted assumption and 4 success criteria.'
    },
    {
      runId: 'run-demo-001',
      stage: 'Policy',
      eventType: 'Budget & Guardrails',
      timestamp: '03:45:02',
      status: 'success',
      detail: 'Max cost cap $0.50 enforced. Prompt injection check passed.'
    },
    {
      runId: 'run-demo-001',
      stage: 'Context',
      eventType: 'Document Attachment',
      timestamp: '03:45:02',
      status: 'success',
      detail: 'Attached synthetic sales table (5 rows, 4 columns).'
    },
    {
      runId: 'run-demo-001',
      stage: 'Model',
      eventType: 'Inference Call',
      timestamp: '03:45:03',
      status: 'success',
      detail: 'Executed Demo Model Profile (Simulated). Latency: 3.2s.'
    },
    {
      runId: 'run-demo-001',
      stage: 'Reasoning',
      eventType: 'Chain of Thought',
      timestamp: '03:45:04',
      status: 'success',
      detail: 'Simulated reasoning effort: medium. Standard token generation complete.'
    },
    {
      runId: 'run-demo-001',
      stage: 'Tools',
      eventType: 'MCP Interception',
      timestamp: '03:45:04',
      status: 'skipped',
      detail: 'Skipped, no tools enabled for direct prompt run.'
    },
    {
      runId: 'run-demo-001',
      stage: 'Verify',
      eventType: 'Contract Check',
      timestamp: '03:45:05',
      status: 'warning',
      detail: 'Verification complete: 3 criteria failed, 1 partial.'
    }
  ],
  answers: [
    {
      id: 'ans-v1',
      versionNumber: 1,
      content: `September sales grew, led by strong North performance of $462K (+10.0%) thanks to the new regional campaign. East also improved to $535K (+4.9%). Overall, the team should keep investing in the North.`,
      iteration: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: 'ans-v2',
      versionNumber: 2,
      content: `Total sales were flat month over month: $1,600K in August and $1,600K in September (0.0%). The mix shifted between regions.
- North: $420K to $462K (+10.0%)
- East: $510K to $535K (+4.9%)
- South: $380K to $342K (−10.0%)
- West: $290K to $261K (−10.0%)
Takeaway: gains in North and East were offset by declines in South and West. The data does not show the cause of these changes.`,
      parentId: 'ans-v1',
      iteration: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    }
  ],
  verificationReports: [
    {
      id: 'rep-v1',
      answerVersionId: 'ans-v1',
      contractVersion: 1,
      overallStatus: 'failed',
      limitations: 'Model-based findings are judgments, not proof. Verification is traceable to answer v1 and contract v1.',
      findings: [
        {
          id: 'f-1',
          criterionCode: 'b',
          criterionText: 'states the total change correctly',
          status: 'not_met',
          severity: 'high',
          checkType: 'Deterministic check',
          detail: 'Recomputed total is $1,600K in August and $1,600K in September (0.0% change), but the answer implies overall growth.',
          evidenceExcerpt: 'September sales grew...'
        },
        {
          id: 'f-2',
          criterionCode: 'a',
          criterionText: 'covers every region',
          status: 'not_met',
          severity: 'high',
          checkType: 'Deterministic check',
          detail: 'South (−10.0%) and West (−10.0%) are not mentioned.',
          evidenceExcerpt: 'North... East...'
        },
        {
          id: 'f-3',
          criterionCode: 'c',
          criterionText: 'every claim is supported by the table',
          status: 'not_met',
          severity: 'medium',
          checkType: 'Model-based judgment',
          detail: '"Thanks to the new regional campaign" is a potential unsupported claim. No campaign data was supplied.',
          evidenceExcerpt: '...thanks to the new regional campaign.'
        },
        {
          id: 'f-4',
          criterionCode: 'd',
          criterionText: 'concise enough for a team update',
          status: 'partial',
          severity: 'low',
          checkType: 'Model-based judgment',
          detail: 'Length is fine, but the recommendation to keep investing in the North is not supported by the data provided.',
          evidenceExcerpt: 'Overall, the team should keep investing in the North.'
        }
      ]
    },
    {
      id: 'rep-v2',
      answerVersionId: 'ans-v2',
      contractVersion: 1,
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
    }
  ],
  usageHistory: [
    {
      isDemo: true,
      provenance: 'DEMO, synthetic',
      inputTokens: 1284,
      outputTokens: 412,
      durationSec: 3.2,
      costUsd: 0.0088,
      rateCardNote: 'demo rate card, not a real provider price ($3 per million input, $12 per million output)'
    },
    {
      isDemo: true,
      provenance: 'DEMO, synthetic',
      inputTokens: 1610,
      outputTokens: 438,
      durationSec: 2.9,
      costUsd: 0.0101,
      rateCardNote: 'demo rate card, not a real provider price ($3 per million input, $12 per million output)'
    }
  ],
  toolCalls: [
    {
      id: 'tool-001',
      toolName: 'MCP Calc / Verifier',
      status: 'executed',
      input: 'SUM(North: 462, South: 342, East: 535, West: 261)',
      output: '1600 (0.0% change vs August total 1600)',
      timestamp: '03:45:04'
    }
  ],
  iterationCount: 1,
  maxIterations: 1,
  stopReason: 'Stopped: issues resolved and the iteration limit of 1 was reached.'
};

export const INITIAL_HISTORICAL_RUNS: Run[] = [
  INITIAL_DEMO_RUN,
  {
    id: 'run-demo-002',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'completed',
    mode: 'demo',
    title: 'Code Refactoring Intent & Verification',
    originalRequest: 'Refactor the data parser to handle malformed JSON gracefully.',
    contract: {
      objective: 'Refactor data parser for error tolerance',
      deliverable: 'TypeScript function with try/catch fallback',
      audience: 'Backend Engineering',
      constraints: ['Zero breaking API changes'],
      assumptions: [{ id: 'asm-101', text: 'Target node runtime v20+', accepted: true }],
      ambiguities: [],
      successCriteria: [
        { id: 'sc-1', code: 'a', text: 'Handles invalid syntax without crashing' },
        { id: 'sc-2', code: 'b', text: 'Returns Result object' }
      ],
      outputFormat: 'TypeScript Code',
      version: 1
    },
    prompts: [
      {
        id: 'p-201',
        versionNumber: 1,
        content: 'Refactor data parser for malformed JSON.',
        format: 'plain',
        source: 'original',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        selected: true,
        estimatedTokenCount: 320,
        tokenizerProvenance: 'cl100k_base tokenizer estimate'
      }
    ],
    activePromptId: 'p-201',
    config: {
      provider: 'Demo Provider (Simulated)',
      model: 'Demo Model Profile (Simulated)',
      contextStrategy: 'Standard',
      toolPermissions: [],
      outputFormat: 'Code',
      timeoutSec: 15,
      retryPolicy: 'Standard',
      reasoningEffort: 'low',
      maxOutputTokens: 1024,
      costLimitUsd: 0.10
    },
    pipelineEvents: [],
    answers: [
      {
        id: 'ans-201',
        versionNumber: 1,
        content: 'export function safeParseJson<T>(raw: string): { success: boolean; data?: T; error?: string } {\n  try {\n    return { success: true, data: JSON.parse(raw) };\n  } catch (err) {\n    return { success: false, error: (err as Error).message };\n  }\n}',
        iteration: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ],
    verificationReports: [
      {
        id: 'rep-201',
        answerVersionId: 'ans-201',
        contractVersion: 1,
        overallStatus: 'passed',
        limitations: 'Verified via AST static analysis fixture.',
        findings: [
          {
            id: 'f-201',
            criterionCode: 'a',
            criterionText: 'Handles invalid syntax without crashing',
            status: 'met',
            severity: 'low',
            checkType: 'Deterministic check',
            detail: 'Try-catch block wraps JSON.parse.'
          }
        ]
      }
    ],
    usageHistory: [
      {
        isDemo: true,
        provenance: 'DEMO, synthetic',
        inputTokens: 320,
        outputTokens: 180,
        durationSec: 1.4,
        costUsd: 0.0031,
        rateCardNote: 'demo rate card'
      }
    ],
    toolCalls: [],
    iterationCount: 0,
    maxIterations: 1
  }
];
