export type NavigationTab = 
  | 'workbench' 
  | 'execution' 
  | 'quality' 
  | 'repair' 
  | 'ml_predictions'
  | 'insights';

export type TaskType = 
  | 'text' 
  | 'coding' 
  | 'research' 
  | 'data_analysis' 
  | 'image' 
  | 'video' 
  | 'writing';

export type ClaimStatus = 
  | 'VERIFIED' 
  | 'SUPPORTED' 
  | 'INFERRED' 
  | 'ASSUMED' 
  | 'UNVERIFIED' 
  | 'CONTRADICTED';

export type RequirementStatus = 'SATISFIED' | 'FAILED' | 'UNCERTAIN' | 'UNSUPPORTED';

export type PipelineStage = 
  | 'Intent' 
  | 'Policy' 
  | 'Context' 
  | 'Prompt' 
  | 'Model' 
  | 'Reasoning' 
  | 'Tools' 
  | 'Verify';

export type StageState = 
  | 'idle' 
  | 'active' 
  | 'completed' 
  | 'failed' 
  | 'skipped' 
  | 'blocked' 
  | 'retrying' 
  | 'cancelled';

export type ProvenanceType = 
  | 'provider_reported' 
  | 'measured_locally' 
  | 'estimated' 
  | 'unavailable';

export interface HardConstraints {
  maxCostUsd: number;
  maxTokens: number;
  maxLatencyMs: number;
  maxRetries: number;
  localOnly: boolean;
  requiredFormat: string;
  forbiddenOutcomes: string[];
}

export interface IntentContract {
  id: string;
  version: number;
  title: string;
  taskType: TaskType;
  objective: string;
  requirements: string[];
  hardConstraints: HardConstraints;
  confidenceThreshold: number;
  privacyLevel: 'local_only' | 'approved_allowlist' | 'user_selected';
  createdAt: string;
}

export interface PromptLaboratory {
  originalPrompt: string;
  analyzedIntent: string;
  structuredPrompt: string;
  optimizedPrompt: string;
  optimizationNotes: string[];
}

export interface PolicyCandidateAction {
  actionId: string;
  description: string;
  expectedQualityGain: number;
  expectedReqGain: number;
  costEstimateUsd: number;
  latencyEstimateMs: number;
  riskScore: number;
  collateralDamageRisk: number;
  utilityScore: number;
  isSelected: boolean;
  rationale: string;
}

export interface StageTelemetry {
  stage: PipelineStage;
  state: StageState;
  durationMs: number;
  providerModel?: string;
  details: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  status: ClaimStatus;
  source: string;
  url?: string;
  testResult?: string;
  confidenceScore: number;
  provenance: ProvenanceType;
}

export interface RequirementEvaluation {
  id: string;
  requirement: string;
  status: RequirementStatus;
  isHardConstraint: boolean;
  evidenceId?: string;
  failureReason?: string;
  evidenceFound?: string;
  evaluatorIdentity: string; // e.g. "DeterministicSchemaValidator v1.2" or "LLM-Judge"
}

export interface RepairCandidate {
  id: string;
  type: 'targeted_patch' | 'prompt_reinforcement' | 'context_retrieval' | 'model_escalation' | 'full_regeneration';
  description: string;
  targetRequirements: string[];
  predictedQualityGain: number;
  predictedCostUsd: number;
  predictedCollateralDamage: number;
  isRecommended: boolean;
  beforeSnippet?: string;
  afterPatchSnippet?: string;
}

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  runId: string;
  anomalyType: 'token_spike' | 'latency_spike' | 'cost_deviation' | 'tool_failure_loop' | 'quality_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  featureAttribution: { feature: string; zScore: number; weight: number }[];
  score: number;
  reviewedByHuman: boolean;
}

export interface ExecutionRun {
  id: string;
  intentContractId: string;
  timestamp: string;
  taskType: TaskType;
  providerModel: string;
  actualServingModel?: string;
  status: 'READY' | 'NEEDS_IMPROVEMENT' | 'ABSTAIN' | 'FAILED' | 'RUNNING';
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens: number;
  totalCostUsd: number;
  costCalculationMethod?: 'verified_free_tier' | 'provider_reported' | 'estimated' | 'offline_synthesizer';
  provenance: ProvenanceType;
  totalLatencyMs: number;
  stages: StageTelemetry[];
  policyDecisions: PolicyCandidateAction[];
  requirementEvaluations: RequirementEvaluation[];
  evidenceLedger: EvidenceItem[];
  repairAttempts: number;
  anomaly?: AnomalyEvent;
  outputContent: string;
}

export interface ProviderCapability {
  id: string;
  name: string;
  endpoint: string;
  isLocal: boolean;
  models: string[];
  supportsToolCalling: boolean;
  supportsStructuredOutput: boolean;
  status: 'healthy' | 'unreachable' | 'degraded';
}


export type TaskComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ModelRouteRecommendation {
  recommendedModel: string;
  recommendedProvider: string;
  taskComplexity: TaskComplexity;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  baselineCostUsd: number;
  tokenSavingsPct: number;
  costSavingsPct: number;
  reasoning: string;
}

export interface MCPToolItem {
  id: string;
  name: string;
  category: 'database' | 'devtools' | 'security' | 'web' | 'filesystem';
  endpoint: string;
  status: 'ACTIVE' | 'STANDBY' | 'DISCONNECTED';
  latencyMs: number;
  callCount: number;
  description: string;
  capabilities: string[];
}
