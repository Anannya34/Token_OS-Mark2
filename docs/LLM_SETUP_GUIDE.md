# TokenOS — LLM Setup & API Key Configuration Guide

This guide explains how a beginner can obtain, configure, test, and securely store an OpenRouter API key for TokenOS.

---

## 1. How to Obtain an OpenRouter API Key (Step-by-Step)

1. Open your browser and navigate to **[https://openrouter.ai/](https://openrouter.ai/)**.
2. Click **"Sign In"** in the top-right corner.
   * You can sign in instantly using your existing **Google** or **GitHub** account.
3. Once logged in, navigate directly to the API Keys console: **[https://openrouter.ai/keys](https://openrouter.ai/keys)**.
4. Click the **"Create Key"** button.
5. In the prompt:
   * **Key Name:** Enter `TokenOS-Dev` (or any label you prefer).
   * **Credit Limit:** Leave blank or set to `$0.00` if you only plan to use free-tier models (models ending in `:free`).
6. Click **"Create"**.
7. **Copy your API key immediately:**
   * It starts with `sk-or-v1-...`.
   * *Note:* You will only see the full key once upon creation. Store it in a private password manager or keep it on your clipboard.

---

## 2. How to Configure the Key in TokenOS

You can configure your key in TokenOS using either of two methods:

### Method A (Recommended — Direct in UI, 0 Server Restarts):
1. Open TokenOS in your browser: **[http://localhost:3000/](http://localhost:3000/)**.
2. Look at the top-right of the **Workbench** banner and click **`[? Connect LLM API]`** (or click the **`[? API Keys]`** pill in the top navbar).
3. The **Authentication & Security Vault** modal will open to the **API Key Vault** tab.
4. In the **"OpenRouter API Key"** input field, paste your key (`sk-or-v1-...`).
5. Click **"SAVE KEYS & ACTIVATE LIVE LLM INFERENCE"**.
6. TokenOS immediately stores the key securely in your local browser session memory (`sessionStorage`). It will never be committed to Git.

### Method B (Environment Variable in `.env`):
1. Open the project root folder `c:\Users\Sajjad\token-mark1\`.
2. Open the file named `.env`.
3. Locate or add the variable:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
   ```
4. Save the file (`Ctrl + S`).
5. *Security Rule:* Confirm that `.env` is listed in your `.gitignore` file (TokenOS already ignores `.env` by default).

---

## 3. How to Verify That Your Key Works

1. In TokenOS at **[http://localhost:3000/](http://localhost:3000/)**:
2. In the top navbar, set:
   * **Provider:** `OpenRouter (200+ Models)`
   * **Model:** `Llama 3.3 70B (OpenRouter Fast)` or `DeepSeek R1 (OpenRouter Reasoning)`
3. In the **Workbench**, enter a test prompt in the **Core Objective** box:
   ```text
   Write a Python function to compute Fibonacci numbers asynchronously.
   ```
4. Click **`[? COMPILE & EXECUTE ?]`**.
5. TokenOS will transition to **Execution Control**.
6. If the key is valid, you will see the code actively stream in token by token in the **Live Model Stream Output** terminal, with live token metrics and latency updating in real time.

---

## 4. Troubleshooting & Security Rules

* **HTTP 401 Unauthorized:** Your API key is either expired, mistyped, or missing. Re-open `[? Connect LLM API]` and paste the correct `sk-or-v1-...` string.
* **HTTP 429 Rate Limit:** The selected free model is temporarily busy. Switch model in the top navbar to `qwen/qwen-2.5-coder-32b-instruct:free` or use `Ollama Local`.
* **Zero Secret Exposure:** Never paste your real secret key into public chat, GitHub issues, or committed repository files.
