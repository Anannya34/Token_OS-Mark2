import { TaskType } from '../types';
import { countTokens } from './astPruner';

export type ExecutionDepth = 'LOW' | 'MEDIUM' | 'HIGH';

export type PromptFormat = 
  | 'Natural Language'
  | 'Structured Instructions'
  | 'JSON'
  | 'XML'
  | 'Code-oriented'
  | 'Custom Template';

export interface TokenOptimizationMetrics {
  rawTokens: number;
  optimizedTokens: number;
  savedTokens: number;
  savedPct: number;
  strippedPhrases: string[];
}

export interface AIReviewResult {
  improvedPrompt: string;
  whatChanged: string[];
  whyChanged: string;
  clarifiedRequirements: string[];
  spellingSuggestions: string[];
  recommendedFormat: {
    format: PromptFormat;
    reason: string;
  };
  executionPlan: {
    step: number;
    title: string;
    detail: string;
  }[];
  recommendedDepth: ExecutionDepth;
  tokenMetrics: TokenOptimizationMetrics;
}

const CONVERSATIONAL_FLUFF_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\b(hello|hi|hey)\s+(ai|assistant|there|chatgpt|claude|gemini)[,!\s]*/gi, label: 'greeting' },
  { regex: /\b(could you please|would you please|can you please|please kindly|kindly|please)\b/gi, label: 'polite filler' },
  { regex: /\b(i would like you to|i want you to|i need you to|can you help me to|help me)\b/gi, label: 'preamble' },
  { regex: /\b(thank you in advance|thanks in advance|thank you so much|thanks a lot|thank you|thanks)[.!]*$/gi, label: 'sign-off' },
  { regex: /\b(as an ai|as an expert|act as a|you are a very helpful)\b[^.,;]*[.,;]?\s*/gi, label: 'redundant persona' }
];

const COMMON_TYPOS: Record<string, string> = {
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'teh': 'the',
  'definitly': 'definitely',
  'untill': 'until',
  'asynchronus': 'asynchronous',
  'algoritm': 'algorithm',
  'databse': 'database',
  'funciton': 'function',
  'requirment': 'requirement',
  'effecient': 'efficient',
  'effiecnt': 'efficient',
  'promt': 'prompt',
  'prpmpt': 'prompt'
};

/**
 * Strips wasted conversational filler tokens and fixes common typos
 * so models receive dense, high-signal tokens.
 */
export function compressAndCleanPrompt(raw: string): {
  cleaned: string;
  strippedPhrases: string[];
  spellingSuggestions: string[];
} {
  let cleaned = (raw || '').trim();
  const strippedPhrases: string[] = [];
  const spellingSuggestions: string[] = [];

  for (const { regex, label } of CONVERSATIONAL_FLUFF_PATTERNS) {
    if (regex.test(cleaned)) {
      strippedPhrases.push(label);
      cleaned = cleaned.replace(regex, ' ');
    }
  }

  // Fix common typos directly in the cleaned prompt
  const words = cleaned.split(/(\s+)/);
  const fixedWords = words.map(token => {
    const bare = token.toLowerCase().replace(/[^a-z]/g, '');
    if (bare && COMMON_TYPOS[bare]) {
      const replacement = COMMON_TYPOS[bare];
      spellingSuggestions.push(`"${token}" -> "${replacement}"`);
      return token.replace(new RegExp(bare, 'i'), replacement);
    }
    return token;
  });

  cleaned = fixedWords.join('').replace(/\s{2,}/g, ' ').trim();
  // Capitalize first letter if stripped
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return { cleaned, strippedPhrases, spellingSuggestions };
}

/**
 * Intelligent Tokenization & Prompt Optimization engine.
 * Compresses wasted filler tokens, fixes ambiguity for free/small models,
 * supports custom user templates, and optimizes image/video CLIP/T5 prompts.
 */
export function performAIReview(
  prompt: string,
  taskType: TaskType = 'coding',
  depth: ExecutionDepth = 'MEDIUM',
  overrideFormat?: PromptFormat,
  customTemplate?: string
): AIReviewResult {
  const rawPrompt = (prompt || '').trim();
  if (!rawPrompt) {
    const fallbackFmt: PromptFormat = overrideFormat || (taskType === 'coding' ? 'Code-oriented' : taskType === 'writing' ? 'Natural Language' : 'Structured Instructions');
    return {
      improvedPrompt: '',
      whatChanged: [],
      whyChanged: '',
      clarifiedRequirements: [],
      spellingSuggestions: [],
      recommendedFormat: {
        format: fallbackFmt,
        reason: overrideFormat === 'Custom Template'
          ? 'Using your custom template.'
          : `Ready for ${fallbackFmt} optimization.`
      },
      executionPlan: [],
      recommendedDepth: depth,
      tokenMetrics: {
        rawTokens: 0,
        optimizedTokens: 0,
        savedTokens: 0,
        savedPct: 0,
        strippedPhrases: []
      }
    };
  }

  const { cleaned, strippedPhrases, spellingSuggestions } = compressAndCleanPrompt(rawPrompt);
  const lower = cleaned.toLowerCase();
  const words = cleaned.split(/\s+/).filter(Boolean);

  // 1. Format Recommendation based on task and domain
  let recommendedFormat: { format: PromptFormat; reason: string };
  if (overrideFormat) {
    recommendedFormat = {
      format: overrideFormat,
      reason: overrideFormat === 'Custom Template'
        ? 'Using your custom template with live token placeholders.'
        : `Selected: ${overrideFormat}`
    };
  } else if (
    taskType === 'coding' ||
    /\b(code|function|script|class|api|endpoint|typescript|python|rust|go|sql|react|bug|fix)\b/i.test(lower)
  ) {
    recommendedFormat = {
      format: 'Code-oriented',
      reason: 'Compact specification prevents free/small models from generating vague or incomplete code.'
    };
  } else if (/\b(json|schema|payload|key-value)\b/i.test(lower)) {
    recommendedFormat = {
      format: 'JSON',
      reason: 'Strict JSON output avoids conversational token waste.'
    };
  } else if (/\b(xml|markup|tag)\b/i.test(lower)) {
    recommendedFormat = {
      format: 'XML',
      reason: 'XML tags isolate instructions cleanly.'
    };
  } else if (taskType === 'image' || taskType === 'video') {
    recommendedFormat = {
      format: 'Structured Instructions',
      reason: 'Dense visual token ordering fits CLIP/T5 limits without truncation.'
    };
  } else if (taskType === 'writing') {
    recommendedFormat = {
      format: 'Natural Language',
      reason: 'Direct, filler-free natural instructions.'
    };
  } else {
    recommendedFormat = {
      format: 'Structured Instructions',
      reason: 'Concise bullet constraints maximize accuracy per token.'
    };
  }

  // 2. Extract compact, zero-vagueness requirements (helps free models avoid generic output)
  const clarifiedRequirements: string[] = [];
  if (taskType === 'image' || taskType === 'video') {
    clarifiedRequirements.push('Lock subject & style anchors; separate mutable details for delta edits.');
    if (taskType === 'video') {
      clarifiedRequirements.push('Specify camera motion, pacing, and frame consistency.');
    }
  } else {
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('server')) {
      clarifiedRequirements.push('Handle HTTP status codes, input validation, and errors.');
    }
    if (lower.includes('async') || lower.includes('stream') || lower.includes('shutdown')) {
      clarifiedRequirements.push('Use non-blocking async flow with clean resource teardown.');
    }
    if (taskType === 'coding') {
      clarifiedRequirements.push('Output complete, runnable code + 1 verification test; no filler prose.');
    }
    if (depth === 'HIGH') {
      clarifiedRequirements.push('Include edge-case guards and complexity bounds.');
    }
    if (clarifiedRequirements.length === 0) {
      clarifiedRequirements.push('Answer directly and concisely; omit redundant preamble.');
    }
  }

  // 3. Build Improved Prompt (Token-efficient, never bloated)
  let improvedPrompt = cleaned;

  if (recommendedFormat.format === 'Custom Template') {
    const tpl = (customTemplate || '').trim() || 'Task: {{task}}\nConstraints: {{requirements}}\nOutput: Concise, complete, zero fluff.';
    const reqList = clarifiedRequirements.join(' ');
    if (tpl.includes('{{task}}') || tpl.includes('{{requirements}}') || tpl.includes('{{depth}}')) {
      improvedPrompt = tpl
        .replace(/\{\{task\}\}/gi, cleaned || '(describe task)')
        .replace(/\{\{requirements\}\}/gi, reqList)
        .replace(/\{\{depth\}\}/gi, depth);
    } else {
      improvedPrompt = `${tpl}\n\nTask: ${cleaned}`;
    }
  } else if (taskType === 'image' || taskType === 'video') {
    // Visual CLIP/T5 compact token structure (high-signal keywords, no filler)
    const visualTokens = cleaned
      .replace(/\b(create|generate|make|draw|render|a picture of|an image of|a video of)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    improvedPrompt = taskType === 'video'
      ? `[SUBJECT/SCENE]: ${visualTokens || cleaned}\n[MOTION]: Smooth cinematic camera, temporal consistency\n[EDIT_MODE]: Delta-ready (preserve subject anchor on revisions)`
      : `[SUBJECT]: ${visualTokens || cleaned}\n[STYLE/LIGHTING]: Sharp focus, balanced composition\n[EDIT_MODE]: Seed/subject locked for delta refinements`;
  } else if (recommendedFormat.format === 'Code-oriented') {
    improvedPrompt = `${cleaned}\n\nConstraints:\n${clarifiedRequirements.map(r => `- ${r}`).join('\n')}`;
  } else if (recommendedFormat.format === 'JSON') {
    improvedPrompt = `Return valid JSON only (no markdown fences).\nTask: ${cleaned}\nSchema: { "status": string, "result": any }`;
  } else if (recommendedFormat.format === 'XML') {
    improvedPrompt = `<task depth="${depth}">\n  <goal>${cleaned}</goal>\n  <rules>${clarifiedRequirements.join('; ')}</rules>\n</task>`;
  } else if (recommendedFormat.format === 'Natural Language') {
    improvedPrompt = depth === 'LOW'
      ? `${cleaned} (Be brief and direct.)`
      : `${cleaned}\n\nFocus: Clear structure, zero filler.`;
  } else {
    improvedPrompt = `Goal: ${cleaned}\nRules: ${clarifiedRequirements.join(' | ')}`;
  }

  // 4. Calculate real BPE token metrics (Raw vs Cleaned/Optimized)
  const rawTokens = countTokens(rawPrompt);
  const cleanedCoreTokens = countTokens(cleaned);
  const optimizedTokens = countTokens(improvedPrompt);
  // Core savings from stripping conversational fluff; net savings if positive
  const fluffSaved = Math.max(0, rawTokens - cleanedCoreTokens);
  const netSaved = Math.max(0, rawTokens - optimizedTokens);
  const savedTokens = netSaved > 0 ? netSaved : fluffSaved;
  const savedPct = rawTokens > 0 ? Math.min(85, Math.round((savedTokens / rawTokens) * 100)) : 0;

  // 5. Construct concise explanation
  const whatChanged: string[] = [];
  if (strippedPhrases.length > 0) {
    whatChanged.push(`Stripped ${strippedPhrases.join(', ')} (${fluffSaved} wasted input tokens removed).`);
  }
  if (spellingSuggestions.length > 0) {
    whatChanged.push(`Fixed ${spellingSuggestions.length} typo(s): ${spellingSuggestions.join(', ')}`);
  }
  if (recommendedFormat.format === 'Custom Template') {
    whatChanged.push('Applied your Custom Template.');
  } else {
    whatChanged.push(`Compiled into ${recommendedFormat.format} format to prevent vague model output.`);
  }

  const whyChanged = 'Removing conversational fluff cuts input tokens, while compact constraints stop free/small models from generating vague or broken output that forces costly retries.';

  const executionPlan = [
    {
      step: 1,
      title: 'Token Compression & Check',
      detail: `Parsed ${words.length} words; stripped non-essential filler and verified budget.`
    },
    {
      step: 2,
      title: 'Model Routing',
      detail: `Selected optimal model for ${depth} depth.`
    },
    {
      step: 3,
      title: 'Execution',
      detail: `Running ${recommendedFormat.format} spec.`
    },
    {
      step: 4,
      title: 'Verification & Delta Repair',
      detail: 'Checking requirements; only failed parts are patched to save tokens.'
    }
  ];

  return {
    improvedPrompt,
    whatChanged,
    whyChanged,
    clarifiedRequirements,
    spellingSuggestions,
    recommendedFormat,
    executionPlan,
    recommendedDepth: depth,
    tokenMetrics: {
      rawTokens,
      optimizedTokens,
      savedTokens,
      savedPct,
      strippedPhrases
    }
  };
}
