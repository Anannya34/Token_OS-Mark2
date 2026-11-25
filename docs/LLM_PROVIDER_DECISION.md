# TokenOS — LLM Provider Decision & Architecture Evaluation

## 1. Executive Summary & Provider Decision
* **Selected Primary Provider:** **OpenRouter** (`https://openrouter.ai/`)
* **Default Verified Model Identifier:** `meta-llama/llama-3.3-70b-instruct:free` (with `deepseek/deepseek-r1:free` and `qwen/qwen-2.5-coder-32b-instruct:free` as secondary free options).
* **Primary Decision Rule:** OpenRouter provides a single OpenAI-compatible HTTP interface giving immediate access to verified free-tier models and 200+ frontier models, supports Server-Sent Events (SSE) streaming token-by-token, and returns exact token usage metrics (`prompt_tokens`, `completion_tokens`, `total_tokens`).

---

## 2. Comprehensive Provider Comparison Matrix

| Criteria | 1. OpenRouter (Primary) | 2. Groq Cloud (Secondary) | 3. Google Gemini API | 4. Ollama Local |
| :--- | :--- | :--- | :--- | :--- |
| **API Architecture** | OpenAI-Compatible REST / SSE | OpenAI-Compatible REST / SSE | Google REST / Vertex SDK | Local HTTP / REST |
| **Ease of Setup** | High (1 API key for 200+ models) | High (Instant key in console) | Medium (Google Cloud/AI Studio) | Medium (Requires local install & RAM) |
| **Free Tier Available** | Yes (Free models with `:free` tag) | Yes (Generous 30 RPM quota) | Yes (15 RPM / 1,500 RPD) | Yes (100% free offline) |
| **Verified Models** | `meta-llama/llama-3.3-70b-instruct:free`<br>`deepseek/deepseek-r1:free`<br>`qwen/qwen-2.5-coder-32b-instruct:free` | `llama-3.3-70b-versatile`<br>`llama-3.1-8b-instant` | `gemini-2.0-flash-exp`<br>`gemini-1.5-flash` | `mistral:latest`<br>`qwen2.5-coder:7b` |
| **Context Window** | 128k - 200k tokens | 8k - 128k tokens | Up to 1M tokens | 4k - 32k (RAM bounded) |
| **Streaming Support** | SSE (`stream: true`) | SSE (`stream: true`) | SSE / Chunk streaming | NDJSON / SSE |
| **Token Accounting** | Native in HTTP response payload | Native in HTTP response payload | Native via usage metadata | Native via eval count |
| **Latency (TTFT)** | ~400ms - 800ms | ~180ms - 300ms | ~400ms - 600ms | Bounded by local CPU/GPU |
| **Data Privacy** | Zero-retention on privacy endpoints | Cloud processed | Cloud processed | 100% on-device sovereign |
| **Suitability for TokenOS** | **Highest (Meets all criteria)** | High (Speed benchmark) | Medium (Requires SDK fork) | High (Offline privacy mode) |

---

## 3. Reason for OpenRouter Selection
1. **Zero Multi-SDK Overhead:** TokenOS needs to benchmark and auto-route between different model families (Llama 3.3, DeepSeek R1, Qwen 2.5 Coder, Mistral). OpenRouter allows switching across all these models without modifying client SDKs or installing vendor libraries.
2. **Deterministic Token Accounting:** OpenRouter passes through the exact provider token metrics, enabling TokenOS's Intent-Aware Token Optimizer to calculate savings against frontier model baselines.
3. **Free Discovery Compatibility:** Models with `:free` suffix allow beginners to test the control plane without depositing credit cards or activating paid subscriptions.

---

## 4. Known Limitations & Mitigation Strategies
* **Free Tier Rate Limits:** OpenRouter free models have an approximate rate limit of 20 requests per minute and 200 requests per day. 
  * *Mitigation:* TokenOS includes an automatic fallback to the deterministic synthesizer and local Ollama if rate limits (HTTP 429) or upstream outages occur.
* **Provider Routing Fluctuations:** Free model endpoints may experience temporary provider queueing during peak hours.
  * *Mitigation:* TokenOS sets a 15-second request timeout and displays clear status banners in the UI instead of hanging silently.
