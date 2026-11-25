import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 'xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-bgDeep/75 backdrop-blur-sm">
      <div className="absolute inset-0 flex justify-end">
        <div
          className={clsx(
            'surface-modal rounded-r-none rounded-l-[14px] w-full h-full flex flex-col overflow-hidden text-textPrimary animate-in slide-in-from-right duration-200',
            widthClasses[width]
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-borderColor bg-surface">
            <div className="text-base font-semibold text-textPrimary">{title}</div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-textMuted hover:text-textPrimary hover:bg-surfaceElevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-borderColor bg-surface flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
