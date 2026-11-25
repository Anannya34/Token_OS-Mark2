import type { LLMProviderAdapter, CommonModelInfo, ProviderHealth } from './types.ts';
import { GeminiProvider, VERIFIED_GEMINI_MODELS } from './geminiProvider.ts';
import { OpenRouterProvider, VERIFIED_OPENROUTER_FREE_MODELS } from './openrouterProvider.ts';
import { OllamaProvider } from './ollamaProvider.ts';
import { GroqProvider, VERIFIED_GROQ_MODELS } from './groqProvider.ts';

class ProviderRegistry {
  private providers: Map<string, LLMProviderAdapter> = new Map();

  constructor() {
    this.register(new GeminiProvider());
    this.register(new OpenRouterProvider());
    this.register(new OllamaProvider());
    this.register(new GroqProvider());
  }

  register(provider: LLMProviderAdapter) {
    this.providers.set(provider.id.toLowerCase(), provider);
  }

  getProvider(id: string): LLMProviderAdapter {
    const cleanId = id.toLowerCase();
    if (cleanId === 'google') return this.providers.get('gemini')!;
    const provider = this.providers.get(cleanId);
    if (!provider) {
      // Default to Gemini as sovereign primary provider
      return this.providers.get('gemini')!;
    }
    return provider;
  }

  listProviders(): { id: string; name: string; isConfigured: boolean }[] {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      isConfigured: p.isConfigured()
    }));
  }

  async getAllAvailableModels(): Promise<CommonModelInfo[]> {
    const allModels: CommonModelInfo[] = [];

    for (const provider of this.providers.values()) {
      try {
        const models = await provider.listModels();
        allModels.push(...models);
      } catch {
        // Fallback to static catalog if dynamic discovery times out
        if (provider.id === 'gemini') allModels.push(...VERIFIED_GEMINI_MODELS);
        if (provider.id === 'openrouter') allModels.push(...VERIFIED_OPENROUTER_FREE_MODELS);
        if (provider.id === 'groq') allModels.push(...VERIFIED_GROQ_MODELS);
      }
    }

    return allModels;
  }

  async checkAllHealth(): Promise<Record<string, ProviderHealth>> {
    const results: Record<string, ProviderHealth> = {};
    for (const [id, provider] of this.providers.entries()) {
      try {
        results[id] = await provider.checkHealth();
      } catch (err: any) {
        results[id] = { online: false, message: err.message || 'Health probe failed' };
      }
    }
    return results;
  }
}

export const providerRegistry = new ProviderRegistry();
