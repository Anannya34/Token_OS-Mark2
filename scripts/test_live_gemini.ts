import { executeTokenPipeline } from '../src/services/aiEngine.ts';
import type { IntentContract } from '../src/types/index.ts';
import fs from 'fs';

// Read VITE_GEMINI_API_KEY from .env
const envText = fs.readFileSync('.env', 'utf8');
const keyMatch = envText.match(/VITE_GEMINI_API_KEY=([^\r\n]+)/);
const geminiKey = keyMatch ? keyMatch[1].trim() : '';

console.log('Testing live Gemini integration with real key (masked):', geminiKey.slice(0, 4) + '...' + geminiKey.slice(-4));

const contract: IntentContract = {
  id: 'contract-live-1',
  version: 1,
  title: 'Live Gemini Probe',
  taskType: 'coding',
  objective: 'Write a TypeScript function to calculate Fibonacci numbers with memoization',
  requirements: [
    'TypeScript typing',
    'Memoization map',
    'Automated unit test assertion'
  ],
  hardConstraints: {
    maxCostUsd: 0.05,
    maxTokens: 1000,
    maxLatencyMs: 5000,
    maxRetries: 1,
    localOnly: false,
    requiredFormat: 'typescript',
    forbiddenOutcomes: []
  },
  confidenceThreshold: 0.9,
  privacyLevel: 'user_selected',
  createdAt: new Date().toISOString()
};

async function testLive() {
  let chunks = 0;
  let fullOutput = '';

  const run = await executeTokenPipeline({
    prompt: contract.objective,
    contract,
    provider: 'gemini',
    model: 'gemini-flash-latest',
    geminiApiKey: geminiKey,
    onTokenStream: (token, acc) => {
      chunks++;
      fullOutput = acc;
    }
  });

  console.log('\n--- LIVE GEMINI RESPONSE SUMMARY ---');
  console.log('Run ID:', run.id);
  console.log('Status:', run.status);
  console.log('Provider/Model:', run.providerModel);
  console.log('Total Tokens:', run.totalTokens);
  console.log('Provenance:', run.provenance);
  console.log('Latency (ms):', run.totalLatencyMs);
  console.log('Streamed chunks received:', chunks);
  console.log('Output length (chars):', fullOutput.length);
  console.log('First 200 chars of generated code:\n', fullOutput.slice(0, 200));

  if (run.provenance === 'provider_reported' && fullOutput.length > 50 && fullOutput.includes('fibonacci')) {
    console.log('\n✔ LIVE GEMINI STREAMING INFERENCE VERIFIED AND AUTHORITATIVE!');
  } else {
    console.log('\nResult output inspected:', fullOutput.slice(0, 300));
  }
}

testLive().catch(console.error);
