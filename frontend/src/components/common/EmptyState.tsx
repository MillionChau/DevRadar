import React from 'react';
import { AppIcon, IconName } from './Icon';
import Button from './Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'fileText',
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  className = '',
}) => {
  const effectiveActionText = actionLabel || actionText;

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-surface-card border border-surface-border rounded-card ${className}`}>
      <div className="w-14 h-14 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center text-text-subtle mb-4">
        <AppIcon name={icon} size={28} />
      </div>
      <h3 className="text-base font-bold text-text-main mb-1.5">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mb-6">{description}</p>
      {effectiveActionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {effectiveActionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
