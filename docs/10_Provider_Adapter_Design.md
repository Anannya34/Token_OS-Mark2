# TokenOS --- Provider Adapter Design Specification

## 1. Modular Provider Adapter Pattern
TokenOS enforces complete decoupling between the core execution engine and individual AI models/vendors. No vendor-specific SDK calls or API assumptions leak into the Policy Engine or Intent Compiler.

---

## 2. Universal Provider Adapter Interface

```python
class BaseProviderAdapter(ABC):
    @abstractmethod
    async def health_check(self) -> ProviderHealthStatus:
        """Verify endpoint connectivity and return latency."""
        pass

    @abstractmethod
    async def list_models(self) -> List[ModelCapabilityMetadata]:
        """Return available model IDs and capabilities (tool calling, vision, structured output)."""
        pass

    @abstractmethod
    async def generate(self, request: StandardizedExecutionRequest) -> StandardizedExecutionResponse:
        """Execute non-streaming request with normalized usage telemetry."""
        pass

    @abstractmethod
    async def stream_generate(self, request: StandardizedExecutionRequest) -> AsyncGenerator[StandardizedStreamChunk, None]:
        """Stream normalized generation chunks over SSE/WebSocket."""
        pass
```

---

## 3. Supported Adapters & Roadmap

### 1. Ollama Adapter (Local-First Priority P0)
- **Base Endpoint:** `http://localhost:11434`
- **Supported Features:** Native streaming, local models (Llama3, Qwen, Mistral, DeepSeek), tool calling (where model supported).
- **Privacy:** `LOCAL_ONLY` tag, zero external data movement.

### 2. Local OpenAI-Compatible Adapter (Local-First Priority P0)
- **Base Endpoint:** `http://localhost:1234/v1` (LM Studio, vLLM, LocalAI)
- **Supported Features:** `/v1/chat/completions`, JSON schema response format, local key authorization.

### 3. Grok Adapter (Future Adapter - P2)
- **Status:** Optional future adapter.
- **Verification Rule:** Before implementation, official current documentation must be verified for endpoints, authentication, model IDs, rate limits, and usage pricing. API keys must remain strictly in environment variables.

---

## 4. Usage Provenance Tracking
TokenOS tracks exact token usage and financial cost with strict metadata provenance:
- `provider_reported`: Directly returned by API usage payload.
- `measured_locally`: Calculated using local tokenizer (tiktoken / transformers).
- `estimated`: Derived from character count heuristics.
- `unavailable`: Explicitly marked when unavailable. Never invent token counts or cost figures.
