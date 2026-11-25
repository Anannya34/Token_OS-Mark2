import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  headerBorder = true,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'surface-card p-5 text-textPrimary flex flex-col gap-4',
          className
        )
      )}
    >
      {(title || action) && (
        <div
          className={clsx(
            'flex items-center justify-between pb-3',
            headerBorder && 'border-b border-borderColor'
          )}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-textPrimary leading-snug">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-textSecondary mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
};
