# TOKEN-OS: Next Steps & Future Roadmap

## 1. Quick Start Guide for Developers

### Prerequisites
- Node.js v18+ (tested on Node.js v22)
- npm or yarn

### Step-by-Step Launch
1. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```
2. **Execute Full Test Suite**:
   ```bash
   npm test
   ```
   *Runs 46 Security & Auth tests + 20 LLM Pipeline & Token Optimization tests (Total: 66 assertions).*
3. **Build Production Bundle**:
   ```bash
   npm run build
   ```
4. **Launch Application**:
   ```bash
   npm run preview
   # or
   npm run dev
   ```
5. **Open Browser**:
   Navigate to `http://localhost:3000/`.

---

## 2. Configuring Real LLM API Keys
1. In the TOKEN-OS dashboard, click `[⚡ API Keys]` in the top navigation bar or `[⚡ Connect LLM API]` in the Workbench.
2. Select the **API Key Vault** tab.
3. Paste your OpenRouter API key (format: `sk-or-v1-...`) obtained from [openrouter.ai/keys](https://openrouter.ai/keys).
4. *(Optional)* Add your NVIDIA NIM or Groq API key for multi-provider redundancy.
5. Click **SAVE CREDENTIALS**. Your key is securely stored in your browser's private session storage and will never be committed to Git.
6. Select any `:free` model (e.g. `meta-llama/llama-3.3-70b-instruct:free`) from the top bar dropdown to generate code at $0 cost.

---

## 3. Prioritized Engineering Roadmap

### Priority 1: Automated Fallback Router
- If an OpenRouter free tier model encounters an HTTP 429 (Rate Limit) or HTTP 503 (Provider Capacity), dynamically cascade to the next available `:free` model (e.g. `deepseek/deepseek-r1:free` or `qwen/qwen-2.5-coder-32b-instruct:free`) without interrupting the user.

### Priority 2: MCP (Model Context Protocol) Server Integration
- Implement bidirectional MCP connector tools in the MCP Hub tab.
- Allow TOKEN-OS to inspect live local filesystem directories, execute test commands, and query PostgreSQL schemas directly as external tools during the `Tools` pipeline stage.

### Priority 3: Persistent Database Sync with Supabase
- Connect a live Supabase project by entering your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the Database tab of the Auth modal.
- The included `supabase_schema.sql` automatically creates all required tables (`profiles`, `intent_contracts`, `execution_runs`, `security_audit_logs`) with enterprise Row Level Security (RLS) policies.

### Priority 4: Vector Store Context Retrieval
- Add pgvector or local embeddings (Transformers.js) for semantic retrieval over large codebases to complement the existing AST compression engine.
