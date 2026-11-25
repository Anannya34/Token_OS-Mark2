import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface-card overflow-hidden border border-borderColor flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bgDeep border-b border-borderColor text-xs text-textMuted">
        <span className="font-mono text-[11px] text-textSecondary">{title || language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-textPrimary bg-surface overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
    </div>
  );
};
