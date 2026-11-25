import type { 
  LLMProviderAdapter, 
  CommonModelInfo, 
  ProviderRequest, 
  ProviderResponse, 
  ProviderUsage, 
  ProviderHealth 
} from './types.ts';

export class OllamaProvider implements LLMProviderAdapter {
  readonly id = 'ollama';
  readonly name = 'Local Ollama (Sovereign)';

  isConfigured(): boolean {
    return true;
  }

  async listModels(): Promise<CommonModelInfo[]> {
    try {
      const res = await fetch('/api/ollama/api/tags');
      if (!res.ok) throw new Error();
      const data = await res.json();
      return (data.models || []).map((m: any): CommonModelInfo => ({
        id: m.name || m.model,
        name: String(m.name) + ' (Local)',
        provider: 'ollama',
        category: 'coding',
        isFree: true,
        contextWindow: 32768,
        inputPricingUsdPer1M: 0.0,
        outputPricingUsdPer1M: 0.0,
        supportsStreaming: true,
        isVerified: true,
        description: 'Local sovereign model running entirely offline on your machine.'
      }));
    } catch {
      return [
        {
          id: 'mistral:latest',
          name: 'mistral:latest (Local)',
          provider: 'ollama',
          category: 'general',
          isFree: true,
          contextWindow: 32768,
          inputPricingUsdPer1M: 0.0,
          outputPricingUsdPer1M: 0.0,
          supportsStreaming: true,
          isVerified: false,
          description: 'Default local Ollama model.'
        }
      ];
    }
  }

  async sendRequest(req: ProviderRequest): Promise<ProviderResponse> {
    const t0 = performance.now();
    const url = '/api/ollama/api/generate';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.model || 'mistral:latest',
        prompt: req.systemPrompt ? (req.systemPrompt + '\n\n' + req.prompt) : req.prompt,
        stream: false
      }),
      signal: req.signal
    });

    if (!res.ok) {
      throw new Error('Ollama HTTP Error (' + res.status + '): Make sure Ollama is running on port 11434.');
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    const text = data.response || '';

    const promptTokens = data.prompt_eval_count || Math.round(req.prompt.length / 4);
    const completionTokens = data.eval_count || Math.round(text.length / 4);

    return {
      text,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        costUsd: 0.0,
        provenance: data.eval_count ? 'measured_locally' : 'estimated'
      },
      model: req.model,
      provider: this.id,
      latencyMs
    };
  }

  async streamResponse(
    req: ProviderRequest,
    _apiKey: string | undefined,
    onChunk: (delta: string, accumulated: string) => void,
    onUsage?: (usage: ProviderUsage) => void
  ): Promise<ProviderResponse> {
    const t0 = performance.now();
    const url = '/api/ollama/api/generate';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.model || 'mistral:latest',
        prompt: req.systemPrompt ? (req.systemPrompt + '\n\n' + req.prompt) : req.prompt,
        stream: true
      }),
      signal: req.signal
    });

    if (!res.ok) {
      throw new Error('Ollama HTTP Error (' + res.status + '): Make sure Ollama is running on port 11434.');
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported.');

    const decoder = new TextDecoder();
    let fullText = '';
    let promptTokens = 0;
    let evalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            fullText += json.response;
            onChunk(json.response, fullText);
          }
          if (json.prompt_eval_count) promptTokens = json.prompt_eval_count;
          if (json.eval_count) evalTokens = json.eval_count;
        } catch {}
      }
    }

    const latencyMs = Math.round(performance.now() - t0);
    const usage: ProviderUsage = {
      promptTokens: promptTokens || Math.round(req.prompt.length / 4),
      completionTokens: evalTokens || Math.round(fullText.length / 4),
      totalTokens: (promptTokens + evalTokens) || Math.round((req.prompt.length + fullText.length) / 4),
      costUsd: 0.0,
      provenance: evalTokens ? 'measured_locally' : 'estimated'
    };

    onUsage?.(usage);

    return {
      text: fullText,
      usage,
      model: req.model,
      provider: this.id,
      latencyMs
    };
  }

  async checkHealth(): Promise<ProviderHealth> {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/ollama/api/tags');
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        return { online: true, latencyMs, message: 'Local Ollama is online (' + latencyMs + 'ms)' };
      }
      return { online: false, message: 'Local Ollama endpoint unreachable' };
    } catch {
      return { online: false, message: 'Local Ollama not detected on port 11434' };
    }
  }
}
