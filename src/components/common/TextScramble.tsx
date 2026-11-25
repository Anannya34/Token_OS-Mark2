import React, { useEffect, useState } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
}

const CYBER_CHARS = 'ABCDEF0123456789%#@$&*!?<>[]{}/\\~';

export const TextScramble: React.FC<TextScrambleProps> = ({ 
  text, 
  className = '',
  scrambleSpeed = 30 
}) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    let interval: NodeJS.Timeout;

    interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, scrambleSpeed);

    return () => clearInterval(interval);
  }, [text, scrambleSpeed]);

  return <span className={className}>{displayText}</span>;
};
