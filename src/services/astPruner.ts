import { countTokens as gptCountTokens } from 'gpt-tokenizer';
import * as acorn from 'acorn';

/**
 * Computes exact or high-fidelity token count using BPE (Byte Pair Encoding)
 * with graceful fallback to character heuristics.
 */
export function countTokens(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  try {
    return gptCountTokens(text);
  } catch (err) {
    // Safe heuristic fallback: ~3.8 characters per token
    return Math.max(1, Math.ceil(text.length / 3.8));
  }
}

export interface PruneResult {
  pruned: string;
  rawTokens: number;
  prunedTokens: number;
  savingsPct: number;
  method: string;
}

/**
 * Strips comments, docstrings, and non-functional whitespace deterministically
 * across JavaScript, TypeScript, JSON, Python, and other languages.
 */
export function pruneContextDeterministic(input: string, lang?: string): PruneResult {
  if (!input || !input.trim()) {
    return {
      pruned: input || '',
      rawTokens: 0,
      prunedTokens: 0,
      savingsPct: 0,
      method: 'noop'
    };
  }

  const rawTokens = countTokens(input);
  const normalizedLang = (lang || '').toLowerCase().trim();

  // 1. JSON Minimization
  if (normalizedLang === 'json' || (input.trim().startsWith('{') && input.trim().endsWith('}')) || (input.trim().startsWith('[') && input.trim().endsWith(']'))) {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      const prunedTokens = countTokens(minified);
      const savingsPct = rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - prunedTokens) / rawTokens) * 100)) : 0;
      return {
        pruned: minified,
        rawTokens,
        prunedTokens,
        savingsPct,
        method: 'JSON AST Minifier'
      };
    } catch {
      // Fall through if not valid JSON
    }
  }

  // 2. JavaScript / TypeScript AST Pruning with Acorn
  const isJsTs = normalizedLang === 'javascript' || normalizedLang === 'typescript' || normalizedLang === 'js' || normalizedLang === 'ts' || normalizedLang === 'tsx' || normalizedLang === 'jsx';
  
  if (isJsTs || (!lang && (input.includes('function') || input.includes('const ') || input.includes('import ')))) {
    try {
      const comments: acorn.Comment[] = [];
      acorn.parse(input, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        onComment: comments
      });

      // Remove comments from right to left to keep slice indices valid
      let pruned = input;
      const sorted = [...comments].sort((a, b) => b.start - a.start);
      for (const c of sorted) {
        pruned = pruned.slice(0, c.start) + pruned.slice(c.end);
      }

      // Clean non-functional whitespace: trim trailing line spaces and collapse consecutive blank lines
      const cleaned = pruned
        .split('\n')
        .map(l => l.trimEnd())
        .filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === ''))
        .join('\n')
        .trim();

      const prunedTokens = countTokens(cleaned);
      const savingsPct = rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - prunedTokens) / rawTokens) * 100)) : 0;

      return {
        pruned: cleaned,
        rawTokens,
        prunedTokens,
        savingsPct,
        method: 'Acorn AST Comment & Whitespace Pruner'
      };
    } catch (err: any) {
      console.warn('Acorn AST parser syntax warning (halting AST mutation to preserve integrity):', err.message);
      // Fallback safely without corrupting input: safe regex line cleaner for comments
      const safePruned = safeStripJsComments(input);
      const prunedTokens = countTokens(safePruned);
      const savingsPct = rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - prunedTokens) / rawTokens) * 100)) : 0;
      return {
        pruned: safePruned,
        rawTokens,
        prunedTokens,
        savingsPct,
        method: 'Safe Fallback (Acorn Syntax Warning)'
      };
    }
  }

  // 3. Python & Other Code Pruning
  const isPython = normalizedLang === 'python' || normalizedLang === 'py' || (!lang && (input.includes('def ') || input.includes('import ') || input.includes('class ')));
  if (isPython) {
    const cleaned = prunePythonContext(input);
    const prunedTokens = countTokens(cleaned);
    const savingsPct = rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - prunedTokens) / rawTokens) * 100)) : 0;
    return {
      pruned: cleaned,
      rawTokens,
      prunedTokens,
      savingsPct,
      method: 'Python Docstring & Comment Pruner'
    };
  }

  // 4. Generic deterministic line & comment cleaner
  const genericCleaned = input
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, i, arr) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('--');
      const isRedundantBlank = line.trim() === '' && arr[i - 1]?.trim() === '';
      return !isComment && !isRedundantBlank;
    })
    .join('\n')
    .trim();

  const prunedTokens = countTokens(genericCleaned);
  const savingsPct = rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - prunedTokens) / rawTokens) * 100)) : 0;

  return {
    pruned: genericCleaned,
    rawTokens,
    prunedTokens,
    savingsPct,
    method: 'Deterministic Generic Context Pruner'
  };
}

/**
 * Safely strips JS comments without breaking strings when Acorn flags incomplete syntax
 */
function safeStripJsComments(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }
    if (trimmed.startsWith('//')) {
      continue;
    }
    result.push(line.trimEnd());
  }

  return result
    .filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === ''))
    .join('\n')
    .trim();
}

/**
 * Deterministically strips Python comments, triple-quoted docstrings, and blank lines
 * while strictly preserving indentation and literal strings.
 */
function prunePythonContext(code: string): string {
  let out = '';
  let i = 0;
  const n = code.length;
  let inSingle = false;
  let inDouble = false;
  let inTripleSingle = false;
  let inTripleDouble = false;

  while (i < n) {
    if (!inSingle && !inDouble && !inTripleSingle && !inTripleDouble) {
      // Check for triple quotes
      if (code.slice(i, i + 3) === '"""') {
        inTripleDouble = true;
        i += 3;
        continue;
      }
      if (code.slice(i, i + 3) === "'''") {
        inTripleSingle = true;
        i += 3;
        continue;
      }
      // Check for string starts
      if (code[i] === '"') {
        inDouble = true;
        out += '"';
        i++;
        continue;
      }
      if (code[i] === "'") {
        inSingle = true;
        out += "'";
        i++;
        continue;
      }
      // Check for comment
      if (code[i] === '#') {
        while (i < n && code[i] !== '\n') i++;
        continue;
      }
      out += code[i];
      i++;
    } else if (inTripleDouble) {
      if (code.slice(i, i + 3) === '"""') {
        inTripleDouble = false;
        i += 3;
      } else {
        i++;
      }
    } else if (inTripleSingle) {
      if (code.slice(i, i + 3) === "'''") {
        inTripleSingle = false;
        i += 3;
      } else {
        i++;
      }
    } else if (inDouble) {
      if (code[i] === '\\') {
        out += code[i] + (code[i + 1] || '');
        i += 2;
      } else if (code[i] === '"') {
        out += '"';
        inDouble = false;
        i++;
      } else {
        out += code[i];
        i++;
      }
    } else if (inSingle) {
      if (code[i] === '\\') {
        out += code[i] + (code[i + 1] || '');
        i += 2;
      } else if (code[i] === "'") {
        out += "'";
        inSingle = false;
        i++;
      } else {
        out += code[i];
        i++;
      }
    }
  }

  return out
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === ''))
    .join('\n')
    .trim();
}
