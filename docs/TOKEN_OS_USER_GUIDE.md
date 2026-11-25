# TOKEN-OS User Guide: The Beginner-Friendly, Multi-Provider AI Platform

Welcome to **TOKEN-OS**! Whether you are a student, developer, researcher, or everyday user, TOKEN-OS provides a powerful, transparent, and secure interface to interact with modern AI models without requiring deep technical knowledge.

---

## 1. Quick Start Guide

### Step 1: Open the Application
Navigate to `http://localhost:3000` in your web browser. You will be greeted by the dark cybernetic TOKEN-OS landing screen.

### Step 2: Sign In or Enter Demo Mode
1. Click **Get Started**.
2. If using Supabase authentication:
   - Enter your email and password, or click **Continue with Google**.
   - If testing offline or without an account, click **Sign In** with the default credentials or use local demo mode.
3. You will immediately enter the **TOKEN-OS Workbench**.

---

## 2. Asking Your First Question

In the **Core Objective** box, you will see a clear placeholder:
> *"Type what you want help with. For example, ask a question, write something, explain a topic, or paste your code."*

### Using Starter Scenario Chips
Just above the prompt box, click any of the 5 starter chips to instantly populate a pre-formatted request:
- 💡 **General Question:** Everyday explanations, comparisons, and concepts.
- ✍️ **Writing:** Essays, blog drafts, summaries, and revisions.
- 💻 **Code Debugging:** Explaining code bugs, syntax errors, and optimizations.
- 📐 **Math & Logic:** Step-by-step mathematical reasoning and proofs.
- ⚖️ **Systems Comparison:** Architectural trade-offs and tech stack analysis.

### Custom Prompts
You can type anything in plain English! For example:
- *"Explain how the immune system fights viruses like I'm 10 years old."*
- *"Write a polite follow-up email after a job interview."*
- *"Why is my Python dictionary key lookup throwing a KeyError?"*

---

## 3. Automatic vs. Manual Model Selection

TOKEN-OS provides two clear operating modes:

### Mode 1: Automatic Routing (Recommended for Beginners)
- When **Intelligent Model Auto-Route** is active (`AUTO`), TOKEN-OS analyzes your prompt's intent, complexity, and requirements.
- It automatically selects the most suitable model from your configured providers (e.g., Google Gemini Flash for speed and free tier, or reasoning models for complex logic).
- It provides a transparent, one-sentence explanation of why that model was chosen.
- **Cost Protection:** Automatic routing will never silently escalate from a free model to a paid model without your consent.

### Mode 2: Manual Selection (For Power Users)
- Click the **AUTO** toggle to switch to **MANUAL**.
- A model selector dropdown will appear, allowing you to choose your preferred provider and model directly (e.g., `Google Gemini Flash Latest`, `OpenRouter DeepSeek R1`, `Ollama Local Llama 3`).
- **Strict Rule:** Manual selection is strictly respected and will never be overridden by the system.

---

## 4. Connecting Your AI Providers

TOKEN-OS connects to multiple AI providers. You can configure them in your `.env` file or directly in the **API Key Vault** tab:

### 1. Google AI Studio (Gemini) — *Recommended & Free*
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** and create a key.
3. Paste the key into `.env` as `VITE_GEMINI_API_KEY=your_key` or in the API Key Vault.
4. Gemini Flash provides fast, sub-second responses with 15 requests per minute free of charge!

### 2. OpenRouter Unified Gateway
1. Go to [OpenRouter](https://openrouter.ai/).
2. Create an account and generate an API key at `openrouter.ai/keys`.
3. Add your key to `.env` as `VITE_OPENROUTER_API_KEY=your_key`.
4. OpenRouter gives you access to open-weights models like Gemma, Nemotron, Mistral, and Llama.

### 3. Ollama (100% Local & Sovereign)
1. Download and run [Ollama](https://ollama.ai/) on your computer.
2. Run any model in your terminal: `ollama run llama3`.
3. TOKEN-OS automatically detects your local Ollama instance on port 11434 with zero API keys required and 100% offline privacy!

### 4. Offline Synthesizer (Demo Mode)
If you don't have any API keys configured, TOKEN-OS will not crash! It automatically runs the deterministic **TokenOS Offline Synthesizer** so you can test all pipeline stages, AST reviews, and self-repair features offline.

---

## 5. Execution Control & Telemetry

When you click **[COMPILE & EXECUTE]**:
1. The app transitions to the **Execution Control** screen.
2. **Live Model Stream Output:** Watch the response stream progressively onto the screen.
3. **8-Stage Telemetry Pipeline:**
   - **Intent:** Verifies your objective and schema contract.
   - **Policy:** Evaluates candidate model suitability and utility score.
   - **Context:** Compresses context to save tokens and reduce latency.
   - **Prompt:** Formats your request with safety guardrails.
   - **Model:** Real-time streaming from your chosen model.
   - **Reasoning:** Checks logical coherence.
   - **Tools:** Runs static analysis and AST checks on generated code.
   - **Verify:** Checks the response against your contract requirements.

---

## 6. Understanding the Token Counter & Provenance Badges

TOKEN-OS never displays fake or fabricated numbers. Next to the latency meter, you will see a badge showing exact token accounting:

- **🟢 Provider Reported:** Authoritative token count returned directly by the provider API (e.g., Google AI Studio `usageMetadata`).
- **🔵 Local Hardware:** Token count measured directly by your local Ollama engine.
- **🟡 Estimated:** Clearly labeled running estimate used only during offline demo mode or streaming pending state.
- **🔴 Unavailable:** Indicates that an upstream provider failed before returning token counts.

### Free Tier Guarantee
Models marked as `:free` or Google AI Studio Free Tier are strictly recorded at `$0.0000`. Paid models display provider rate cards, and if rates are unknown, TOKEN-OS displays `Cost unavailable` instead of misleading you with `$0.00`.

---

## 7. Quality Review & IPAR Self-Repair

For code generation and technical tasks:
1. Click **[Quality Review ➔]** after execution to see the **Deterministic AST Validator**.
2. It tests your generated code against explicit contract requirements (concurrency, typing, unit tests, error handling).
3. If an edge case gap is detected (e.g., missing boundary assertions), the status is flagged as `NEEDS_IMPROVEMENT`.
4. Click **[IPAR Targeted Self-Repair ➔]** to inspect an autonomous self-healing patch.
5. Review the side-by-side diff showing the exact targeted fix and click **Apply Fix** to resolve the gap!

---

## 8. Frequently Asked Questions (FAQ)

**Q: Do I need to pay to use TOKEN-OS?**  
A: No! You can use Google AI Studio Gemini Flash for free (15 RPM free tier), run local sovereign models with Ollama for free, or use the built-in offline synthesizer for free.

**Q: Are my API keys safe?**  
A: Yes! TOKEN-OS never sends your API keys to any analytics server, database, or client logs. Keys entered in `.env` or the API Key Vault remain secure.

**Q: What if a provider is down or rate-limited?**  
A: TOKEN-OS displays an honest, human-readable error card explaining the exact HTTP status code and suggested fix. It will never silently substitute a fake response.

**Q: Can I use TOKEN-OS on my phone or tablet?**  
A: Yes! The user interface is fully responsive, adapting seamlessly to mobile screens with touch-friendly navigation drawers.
