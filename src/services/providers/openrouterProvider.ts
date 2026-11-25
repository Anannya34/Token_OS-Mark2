import type { 
  LLMProviderAdapter, 
  CommonModelInfo, 
  ProviderRequest, 
  ProviderResponse, 
  ProviderUsage, 
  ProviderHealth 
} from './types.ts';
import { getActiveProviderKey } from '../apiVaultService.ts';

const BASE_URL = 'https://openrouter.ai/api/v1';

// Current active verified free models discovered on OpenRouter
export const VERIFIED_OPENROUTER_FREE_MODELS: CommonModelInfo[] = [
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B (OpenRouter Free)',
    provider: 'openrouter',
    category: 'coding',
    isFree: true,
    contextWindow: 262144,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: true,
    isVerified: true,
    description: 'Current verified active free model on OpenRouter with 262k context.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (OpenRouter Free)',
    provider: 'openrouter',
    category: 'fast',
    isFree: true,
    contextWindow: 1000000,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: true,
    isVerified: true,
    description: 'Ultra-fast 1M context free reasoning and instruction model.'
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (OpenRouter Free)',
    provider: 'openrouter',
    category: 'reasoning',
    isFree: true,
    contextWindow: 262144,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: true,
    isVerified: true,
    description: 'High-capability instruction-tuned free model for systems analysis.'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (OpenRouter Free)',
    provider: 'openrouter',
    category: 'coding',
    isFree: true,
    contextWindow: 131072,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: false,
    isVerified: true,
    description: 'Specialized code generation and syntax synthesis model.'
  }
];

export class OpenRouterProvider implements LLMProviderAdapter {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter Unified Gateway';

  private resolveKey(explicitKey?: string): string {
    if (explicitKey && explicitKey.trim()) return explicitKey.trim();
    const vaultKey = getActiveProviderKey('openrouter');
    if (vaultKey) return vaultKey.trim();
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const envKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY || (import.meta as any).env.OPENROUTER_API_KEY;
      if (envKey && envKey.trim()) return envKey.trim();
    }
    return '';
  }

  isConfigured(apiKey?: string): boolean {
    return Boolean(this.resolveKey(apiKey));
  }

  async listModels(apiKey?: string): Promise<CommonModelInfo[]> {
    try {
      const res = await fetch(`${BASE_URL}/models`, { method: 'GET' });
      if (!res.ok) return VERIFIED_OPENROUTER_FREE_MODELS;
      const json = await res.json();
      const models: any[] = json.data || [];

      const freeModels = models
        .filter(m => m.id?.endsWith(':free'))
        .map((m): CommonModelInfo => ({
          id: m.id,
          name: `${m.name || m.id} (Free)`,
          provider: 'openrouter',
          category: m.id.includes('code') ? 'coding' : 'general',
          isFree: true,
          contextWindow: m.context_length || 131072,
          inputPricingUsdPer1M: 0.0,
          outputPricingUsdPer1M: 0.0,
          supportsStreaming: true,
          isVerified: true,
          description: m.description?.slice(0, 150) || 'Free tier model on OpenRouter'
        }));

      return freeModels.length > 0 ? freeModels : VERIFIED_OPENROUTER_FREE_MODELS;
    } catch {
      return VERIFIED_OPENROUTER_FREE_MODELS;
    }
  }

  async sendRequest(req: ProviderRequest, apiKey?: string): Promise<ProviderResponse> {
    const key = this.resolveKey(apiKey);
    if (!key) {
      throw new Error('OpenRouter API key is not configured. Add VITE_OPENROUTER_API_KEY to your .env or API vault.');
    }

    const t0 = performance.now();
    let targetModel = req.model || 'google/gemma-4-26b-a4b-it:free';
    if (targetModel.includes('llama-3.3') || targetModel === 'auto-optimal') {
      targetModel = 'google/gemma-4-26b-a4b-it:free';
    }

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TokenOS AI Platform'
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: req.temperature ?? 0.2,
        max_tokens: req.maxTokens,
        stream: false
      }),
      signal: req.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(`OpenRouter Error (${res.status}): ${msg}`);
    }

    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    const text = json.choices?.[0]?.message?.content || '';

    const meta = json.usage;
    const usage: ProviderUsage = {
      promptTokens: meta?.prompt_tokens || Math.round(req.prompt.length / 4),
      completionTokens: meta?.completion_tokens || Math.round(text.length / 4),
      totalTokens: meta?.total_tokens || Math.round((req.prompt.length + text.length) / 4),
      costUsd: targetModel.includes(':free') ? 0.0 : undefined,
      provenance: meta ? 'provider_reported' : 'estimated'
    };

    return {
      text,
      usage,
      model: targetModel,
      provider: this.id,
      latencyMs,
      finishReason: json.choices?.[0]?.finish_reason
    };
  }

  async streamResponse(
    req: ProviderRequest,
    apiKey: string | undefined,
    onChunk: (delta: string, accumulated: string) => void,
    onUsage?: (usage: ProviderUsage) => void
  ): Promise<ProviderResponse> {
    const key = this.resolveKey(apiKey);
    if (!key) {
      throw new Error('OpenRouter API key is not configured. Add VITE_OPENROUTER_API_KEY to your .env or API vault.');
    }

    const t0 = performance.now();
    let targetModel = req.model || 'google/gemma-4-26b-a4b-it:free';
    if (targetModel.includes('llama-3.3') || targetModel === 'auto-optimal') {
      targetModel = 'google/gemma-4-26b-a4b-it:free';
    }

    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TokenOS AI Platform'
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: req.temperature ?? 0.2,
        max_tokens: req.maxTokens,
        stream: true
      }),
      signal: req.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(`OpenRouter Error (${res.status}): ${msg}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported by browser environment.');

    const decoder = new TextDecoder();
    let fullText = '';
    let latestUsage: ProviderUsage | null = null;
    let finishReason: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta, fullText);
            }
            if (json.choices?.[0]?.finish_reason) {
              finishReason = json.choices[0].finish_reason;
            }
            if (json.usage) {
              latestUsage = {
                promptTokens: json.usage.prompt_tokens || 0,
                completionTokens: json.usage.completion_tokens || 0,
                totalTokens: json.usage.total_tokens || 0,
                costUsd: targetModel.includes(':free') ? 0.0 : undefined,
                provenance: 'provider_reported'
              };
              onUsage?.(latestUsage);
            }
          } catch {}
        }
      }
    }

    const latencyMs = Math.round(performance.now() - t0);
    const finalUsage: ProviderUsage = latestUsage || {
      promptTokens: Math.max(1, Math.round(req.prompt.length / 3.8)),
      completionTokens: Math.max(1, Math.round(fullText.length / 3.8)),
      totalTokens: Math.max(2, Math.round((req.prompt.length + fullText.length) / 3.8)),
      costUsd: targetModel.includes(':free') ? 0.0 : undefined,
      provenance: 'estimated'
    };

    return {
      text: fullText,
      usage: finalUsage,
      model: targetModel,
      provider: this.id,
      latencyMs,
      finishReason
    };
  }

  async checkHealth(apiKey?: string): Promise<ProviderHealth> {
    const key = this.resolveKey(apiKey);
    if (!key) {
      return { online: false, message: 'API key not configured in .env (VITE_OPENROUTER_API_KEY)' };
    }

    const t0 = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'TokenOS Health'
        },
        body: JSON.stringify({
          model: 'google/gemma-4-26b-a4b-it:free',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 2
        })
      });

      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        return { online: true, latencyMs, message: `Connected to OpenRouter (${latencyMs}ms)` };
      }

      const text = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(text);
        msg = parsed.error?.message || msg;
      } catch {}
      return { online: false, latencyMs, message: msg };
    } catch (err: any) {
      return { online: false, latencyMs: Math.round(performance.now() - t0), message: err.message || 'Connection failed' };
    }
  }
}
