import type { 
  LLMProviderAdapter, 
  CommonModelInfo, 
  ProviderRequest, 
  ProviderResponse, 
  ProviderUsage, 
  ProviderHealth 
} from './types.ts';
import { getActiveProviderKey } from '../apiVaultService.ts';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.includes('file://')) {
    return '/api/groq';
  }
  return 'https://api.groq.com/openai/v1';
};

export const VERIFIED_GROQ_MODELS: CommonModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Groq LPU)',
    provider: 'groq',
    category: 'coding',
    isFree: true,
    contextWindow: 128000,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: true,
    isVerified: true,
    description: 'Ultra-fast LPU inference under 350ms latency.'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant (Groq LPU)',
    provider: 'groq',
    category: 'fast',
    isFree: true,
    contextWindow: 128000,
    inputPricingUsdPer1M: 0.0,
    outputPricingUsdPer1M: 0.0,
    supportsStreaming: true,
    supportsTools: true,
    isVerified: true,
    description: 'Instant response model for quick questions and editing.'
  }
];

export class GroqProvider implements LLMProviderAdapter {
  readonly id = 'groq';
  readonly name = 'Groq Cloud (Fast LPU)';

  private resolveKey(explicitKey?: string): string {
    if (explicitKey && explicitKey.trim()) return explicitKey.trim();
    const vaultKey = getActiveProviderKey('groq');
    if (vaultKey) return vaultKey.trim();
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const envKey = (import.meta as any).env.VITE_GROQ_API_KEY || (import.meta as any).env.GROQ_API_KEY;
      if (envKey && envKey.trim()) return envKey.trim();
    }
    return '';
  }

  isConfigured(apiKey?: string): boolean {
    return Boolean(this.resolveKey(apiKey));
  }

  async listModels(): Promise<CommonModelInfo[]> {
    return VERIFIED_GROQ_MODELS;
  }

  async sendRequest(req: ProviderRequest, apiKey?: string): Promise<ProviderResponse> {
    const key = this.resolveKey(apiKey);
    if (!key) {
      throw new Error('Groq API key is not configured. Add GROQ_API_KEY in .env or settings.');
    }

    const t0 = performance.now();
    const rawModel = (req.model || '').trim();
    const isValidGroqModel = rawModel && !rawModel.includes('mistral') && !rawModel.includes('gemini') && rawModel !== 'auto';
    const targetModel = isValidGroqModel ? rawModel : 'llama-3.3-70b-versatile';
    const messages = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(getBaseUrl() + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
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
      let msg = 'HTTP ' + res.status;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error('Groq API Error (' + res.status + '): ' + msg);
    }

    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    const text = json.choices?.[0]?.message?.content || '';

    const meta = json.usage;
    const usage: ProviderUsage = {
      promptTokens: meta?.prompt_tokens || Math.round(req.prompt.length / 4),
      completionTokens: meta?.completion_tokens || Math.round(text.length / 4),
      totalTokens: meta?.total_tokens || Math.round((req.prompt.length + text.length) / 4),
      costUsd: 0.0,
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
      throw new Error('Groq API key is not configured. Add GROQ_API_KEY in .env or settings.');
    }

    const t0 = performance.now();
    const rawModel = (req.model || '').trim();
    const isValidGroqModel = rawModel && !rawModel.includes('mistral') && !rawModel.includes('gemini') && rawModel !== 'auto';
    const targetModel = isValidGroqModel ? rawModel : 'llama-3.3-70b-versatile';
    const messages = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.prompt });

    const res = await fetch(getBaseUrl() + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
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
      let msg = 'HTTP ' + res.status;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error('Groq API Error (' + res.status + '): ' + msg);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported.');

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
                costUsd: 0.0,
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
      costUsd: 0.0,
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
    if (!key) return { online: false, message: 'Groq API key not configured' };

    const t0 = performance.now();
    try {
      const res = await fetch(getBaseUrl() + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 2
        })
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        return { online: true, latencyMs, message: 'Connected to Groq Cloud (' + latencyMs + 'ms)' };
      }
      return { online: false, latencyMs, message: 'HTTP ' + res.status };
    } catch (err: any) {
      return { online: false, latencyMs: Math.round(performance.now() - t0), message: err.message };
    }
  }
}
