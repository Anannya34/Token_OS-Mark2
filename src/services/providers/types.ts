export interface CommonModelInfo {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'groq' | 'nvidia' | 'ollama' | 'custom';
  category: 'general' | 'coding' | 'reasoning' | 'writing' | 'fast' | 'research';
  isFree: boolean;
  contextWindow: number;
  inputPricingUsdPer1M?: number;
  outputPricingUsdPer1M?: number;
  supportsStreaming: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  isVerified: boolean;
  description?: string;
}

export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  costUsd?: number;
  provenance: 'provider_reported' | 'measured_locally' | 'estimated';
}

export interface ProviderRequest {
  prompt: string;
  systemPrompt?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ProviderResponse {
  text: string;
  usage: ProviderUsage;
  model: string;
  provider: string;
  latencyMs: number;
  finishReason?: string;
}

export interface ProviderHealth {
  online: boolean;
  message: string;
  latencyMs?: number;
}

export interface LLMProviderAdapter {
  readonly id: string;
  readonly name: string;
  isConfigured(apiKey?: string): boolean;
  listModels(apiKey?: string): Promise<CommonModelInfo[]>;
  sendRequest(req: ProviderRequest, apiKey?: string): Promise<ProviderResponse>;
  streamResponse(
    req: ProviderRequest,
    apiKey: string | undefined,
    onChunk: (delta: string, accumulated: string) => void,
    onUsage?: (usage: ProviderUsage) => void
  ): Promise<ProviderResponse>;
  checkHealth(apiKey?: string): Promise<ProviderHealth>;
}
