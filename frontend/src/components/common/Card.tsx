import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-surface-card border border-surface-border rounded-card',
    surface: 'bg-surface-card border border-surface-border rounded-card',
    elevated: 'bg-surface-elevated border border-surface-border rounded-card shadow-lg',
    interactive: 'bg-surface-card border border-surface-border hover:border-brand-primary/40 rounded-card transition-all duration-150 hover:shadow-md cursor-pointer',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
