import { 
  IntentContract, 
  ExecutionRun, 
  ProviderCapability, 
  RequirementEvaluation, 
  EvidenceItem, 
  RepairCandidate, 
  AnomalyEvent,
  PromptLaboratory
} from '../types';

export const INITIAL_INTENT_CONTRACT: IntentContract = {
  id: 'contract-tk-9042',
  version: 1,
  title: '',
  taskType: 'coding',
  objective: '',
  requirements: [],
  hardConstraints: {
    maxCostUsd: 0.05,
    maxTokens: 4096,
    maxLatencyMs: 3500,
    maxRetries: 2,
    localOnly: false,
    requiredFormat: 'text',
    forbiddenOutcomes: ['blocking loops', 'unhandled exception', 'fake data fallbacks']
  },
  confidenceThreshold: 0.90,
  privacyLevel: 'local_only',
  createdAt: new Date().toISOString()
};

export const INITIAL_PROMPT_LAB: PromptLaboratory = {
  originalPrompt: '',
  analyzedIntent: 'Awaiting task objective definition...',
  structuredPrompt: '[TASK]: Enter your objective in Workbench to synthesize structured parameters.',
  optimizedPrompt: 'Enter your objective in the Core Objective prompt box above to synthesize zero-drift token-optimized instructions.',
  optimizationNotes: [
    'Intelligent model router standing by.',
    'Awaiting user prompt input.'
  ]
};

export const PROVIDER_REGISTRY: ProviderCapability[] = [
  {
    id: 'prov-ollama-local',
    name: 'Ollama Local Instance',
    endpoint: 'http://localhost:11434',
    isLocal: true,
    models: ['llama3.2:3b-instruct-q4_K_M', 'qwen2.5-coder:7b-instruct', 'deepseek-r1:7b'],
    supportsToolCalling: true,
    supportsStructuredOutput: true,
    status: 'healthy'
  },
  {
    id: 'prov-lmstudio-local',
    name: 'LM Studio / Local OpenAI Compatible',
    endpoint: 'http://localhost:1234/v1',
    isLocal: true,
    models: ['mistral-nemo-instruct-2407-12b-q8_0', 'hermes-3-llama-3.1-8b'],
    supportsToolCalling: true,
    supportsStructuredOutput: true,
    status: 'healthy'
  },
  {
    id: 'prov-grok-remote',
    name: 'Grok API Adapter (Future Adapter - Sealed)',
    endpoint: 'https://api.x.ai/v1',
    isLocal: false,
    models: ['grok-2-1212', 'grok-2-vision-1212'],
    supportsToolCalling: true,
    supportsStructuredOutput: true,
    status: 'degraded'
  }
];

export const MOCK_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ev-01',
    claim: 'Non-blocking async loop execution verified',
    status: 'VERIFIED',
    source: 'Deterministic EventLoopProfiler v1.4',
    testResult: 'PASSED: 0ms main thread block duration under 100 concurrent mock pings.',
    confidenceScore: 0.99,
    provenance: 'measured_locally'
  },
  {
    id: 'ev-02',
    claim: 'JSON schema v2.1 strict validation',
    status: 'VERIFIED',
    source: 'Pydantic Schema Validator v2.9',
    testResult: 'PASSED: Validated against FinancialResponseSchema v2.1.',
    confidenceScore: 1.0,
    provenance: 'measured_locally'
  },
  {
    id: 'ev-03',
    claim: 'Unit tests covering missing currency parameter',
    status: 'CONTRADICTED',
    source: 'AST Code Parser Evaluator',
    testResult: 'FAILED: Test fixture `test_missing_currency` missing assert statements.',
    confidenceScore: 0.95,
    provenance: 'measured_locally'
  }
];

export const MOCK_REQUIREMENTS_EVAL: RequirementEvaluation[] = [
  {
    id: 'req-01',
    requirement: 'Must use async/await with zero blocking main-loop latencies.',
    status: 'SATISFIED',
    isHardConstraint: true,
    evidenceId: 'ev-01',
    evaluatorIdentity: 'Deterministic EventLoopProfiler v1.4'
  },
  {
    id: 'req-02',
    requirement: 'Output format must strictly conform to JSON schema v2.1.',
    status: 'SATISFIED',
    isHardConstraint: true,
    evidenceId: 'ev-02',
    evaluatorIdentity: 'Pydantic Schema Validator v2.9'
  },
  {
    id: 'req-03',
    requirement: 'Include unit tests covering edge cases for missing currency parameters.',
    status: 'FAILED',
    isHardConstraint: true,
    evidenceId: 'ev-03',
    failureReason: 'AST static inspection detected missing assertion logic in currency test fixture.',
    evaluatorIdentity: 'AST Code Parser Evaluator'
  },
  {
    id: 'req-04',
    requirement: 'Do not import deprecated pandas financial functions.',
    status: 'SATISFIED',
    isHardConstraint: false,
    evaluatorIdentity: 'Static Linter AST Guard'
  }
];

export const MOCK_REPAIR_CANDIDATES: RepairCandidate[] = [
  {
    id: 'repair-01',
    type: 'targeted_patch',
    description: 'Targeted AST Patch: Inject defensive assertion `assert response.currency == "USD"` in missing currency test fixture.',
    targetRequirements: ['Include unit tests covering edge cases for missing currency parameters.'],
    predictedQualityGain: 0.94,
    predictedCostUsd: 0.0004,
    predictedCollateralDamage: 0.0,
    isRecommended: true,
    beforeSnippet: `def test_missing_currency():
    res = client.post("/analyze", json={"portfolio_id": "p-100"})
    # FIXME: missing assertion`,
    afterPatchSnippet: `def test_missing_currency():
    res = client.post("/analyze", json={"portfolio_id": "p-100"})
    assert res.status_code == 200
    assert res.json()["currency"] == "USD"`
  },
  {
    id: 'repair-02',
    type: 'full_regeneration',
    description: 'Full Pipeline Regeneration: Re-prompt model from scratch with full context window.',
    targetRequirements: ['Include unit tests covering edge cases for missing currency parameters.'],
    predictedQualityGain: 0.88,
    predictedCostUsd: 0.0125,
    predictedCollateralDamage: 0.35,
    isRecommended: false,
    beforeSnippet: `# Entire code block`,
    afterPatchSnippet: `# Regenerated full code block`
  }
];

export const MOCK_ANOMALY_EVENT: AnomalyEvent = {
  id: 'anom-901',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
  runId: 'run-tk-8841',
  anomalyType: 'token_spike',
  severity: 'medium',
  score: 0.88,
  featureAttribution: [
    { feature: 'Output Tokens', zScore: 3.4, weight: 0.55 },
    { feature: 'Context Compression Ratio', zScore: -2.1, weight: 0.25 },
    { feature: 'Tool Retry Count', zScore: 1.8, weight: 0.20 }
  ],
  reviewedByHuman: false
};

export const INITIAL_EXECUTION_RUN: ExecutionRun = {
  id: 'run-tk-ready',
  intentContractId: 'contract-tk-9042',
  timestamp: new Date().toISOString(),
  taskType: 'coding',
  providerModel: 'Gemini Flash Latest (Google AI Studio)',
  status: 'READY',
  totalTokens: 0,
  totalCostUsd: 0.00,
  provenance: 'provider_reported',
  totalLatencyMs: 0,
  stages: [
    { stage: 'Intent', state: 'idle', durationMs: 0, details: 'Standing by for intent contract definition' },
    { stage: 'Policy', state: 'idle', durationMs: 0, details: 'Standing by for model scoring and selection' },
    { stage: 'Context', state: 'idle', durationMs: 0, details: 'Standing by for AST context analysis' },
    { stage: 'Prompt', state: 'idle', durationMs: 0, details: 'Standing by for prompt laboratory synthesis' },
    { stage: 'Model', state: 'idle', durationMs: 0, details: 'Ready for live inference execution' },
    { stage: 'Reasoning', state: 'idle', durationMs: 0, details: 'Standing by for chain of logic check' },
    { stage: 'Tools', state: 'idle', durationMs: 0, details: 'Standing by for AST syntax and test runner' },
    { stage: 'Verify', state: 'idle', durationMs: 0, details: 'Standing by for contract verification' }
  ],
  policyDecisions: [
    {
      actionId: 'act-init',
      description: 'Dynamic Intent Router auto-selection standing by.',
      expectedQualityGain: 0.95,
      expectedReqGain: 0.98,
      costEstimateUsd: 0.00,
      latencyEstimateMs: 650,
      riskScore: 0.02,
      collateralDamageRisk: 0.0,
      utilityScore: 0.96,
      isSelected: true,
      rationale: 'Awaiting task execution to score candidate models.'
    }
  ],
  requirementEvaluations: [],
  evidenceLedger: [],
  repairAttempts: 0,
  outputContent: `# TOKEN-OS Control Plane — Ready for Execution
# 1. Type your objective or prompt in the Workbench.
# 2. Click [COMPILE & EXECUTE] or [START: AUTO-ANALYZE & CONFIGURE INTENT].
# 3. Watch real-time streaming tokens and live preview right here!`
};
