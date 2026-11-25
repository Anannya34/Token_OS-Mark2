export type NavigationScreen =
  | 'Overview'
  | 'Understand Request'
  | 'Optimize Request'
  | 'AI Execution'
  | 'Check Answer'
  | 'Improve Answer'
  | 'Execution History';

export type SystemMode = 'demo' | 'live';

export type StatusType = 'idle' | 'running' | 'completed' | 'failed' | 'needs_review';

export interface Assumption {
  id: string;
  text: string;
  accepted: boolean;
}

export interface SuccessCriterion {
  id: string;
  code: string; // e.g. 'a', 'b', 'c', 'd'
  text: string;
}

export interface IntentContract {
  objective: string;
  deliverable: string;
  audience: string;
  constraints: string[];
  assumptions: Assumption[];
  ambiguities: string[];
  successCriteria: SuccessCriterion[];
  outputFormat: string;
  version: number;
}

export interface PromptVersion {
  id: string;
  versionNumber: number;
  content: string;
  format: 'plain' | 'markdown' | 'json' | 'xml';
  source: 'original' | 'optimized' | 'edited';
  createdAt: string;
  selected: boolean;
  estimatedTokenCount?: number;
  tokenizerProvenance?: string;
  changeSummary?: string;
}

export interface ExecutionConfig {
  provider: string;
  model: string;
  contextStrategy: string;
  toolPermissions: string[];
  outputFormat: string;
  timeoutSec: number;
  retryPolicy: string;
  reasoningEffort: 'low' | 'medium' | 'high' | 'off';
  maxOutputTokens: number;
  costLimitUsd: number;
}

export type PipelineStage = 'Intent' | 'Policy' | 'Context' | 'Model' | 'Reasoning' | 'Tools' | 'Verify';
export type StageStatus = 'pending' | 'active' | 'success' | 'warning' | 'skipped' | 'failed';

export interface ExecutionEvent {
  runId: string;
  stage: PipelineStage;
  eventType: string;
  timestamp: string;
  status: StageStatus;
  detail: string;
  correlationId?: string;
}

export interface AnswerVersion {
  id: string;
  versionNumber: number;
  content: string;
  parentId?: string;
  iteration: number;
  createdAt: string;
}

export type CheckSeverity = 'low' | 'medium' | 'high';
export type CheckType = 'Deterministic check' | 'Model-based judgment';
export type FindingStatus = 'met' | 'partial' | 'not_met' | 'not_evaluated';

export interface Finding {
  id: string;
  criterionCode: string;
  criterionText: string;
  status: FindingStatus;
  severity: CheckSeverity;
  checkType: CheckType;
  detail: string;
  evidenceExcerpt?: string;
  accepted?: boolean;
}

export interface VerificationReport {
  id: string;
  answerVersionId: string;
  contractVersion: number;
  findings: Finding[];
  limitations: string;
  overallStatus: 'passed' | 'failed' | 'needs_review';
}

export interface UsageRecord {
  isDemo: boolean;
  provenance: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  durationSec: number;
  costUsd: number;
  rateCardNote: string;
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  status: 'executed' | 'skipped' | 'failed';
  input: string;
  output: string;
  timestamp: string;
}

export interface Run {
  id: string;
  createdAt: string;
  status: StatusType;
  mode: SystemMode;
  title: string;
  originalRequest: string;
  contract: IntentContract;
  prompts: PromptVersion[];
  activePromptId: string;
  config: ExecutionConfig;
  pipelineEvents: ExecutionEvent[];
  answers: AnswerVersion[];
  verificationReports: VerificationReport[];
  usageHistory: UsageRecord[];
  toolCalls: ToolCallRecord[];
  iterationCount: number;
  maxIterations: number;
  stopReason?: string;
}
