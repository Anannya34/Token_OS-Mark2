import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-surfaceElevated border border-accent text-textPrimary text-xs font-medium rounded-card shadow-lg animate-in slide-in-from-bottom-4 duration-150">
      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
      <span>{message}</span>
    </div>
  );
};
