import React from 'react';
import { AppIcon, IconName } from './Icon';
import { Tooltip, TooltipPosition } from './Tooltip';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: IconName;
  activeIcon?: IconName;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  tooltip?: React.ReactNode;
  tooltipPosition?: TooltipPosition;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  activeIcon,
  iconPosition = 'left',
  isLoading = false,
  tooltip,
  tooltipPosition = 'top',
  disabled,
  className = '',
  title,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 rounded-btn gap-1.5 h-8",
    md: "text-sm px-4 py-2 rounded-btn gap-2 h-10",
    lg: "text-base px-5 py-2.5 rounded-btn gap-2.5 h-12",
    icon: "p-2 rounded-btn h-10 w-10 justify-center",
  };

  const variantClasses = {
    primary: "bg-brand-primary hover:bg-brand-hover text-white shadow-sm active:scale-[0.98]",
    secondary: "bg-surface-elevated hover:bg-surface-border text-text-main border border-surface-border active:scale-[0.98]",
    outline: "bg-transparent hover:bg-surface-elevated text-text-main border border-surface-border active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-surface-elevated text-text-muted hover:text-text-main",
    danger: "bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/30 active:scale-[0.98]",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
    icon: 20,
  };

  const effectiveTooltip = tooltip || title;

  const buttonElement = (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon && iconPosition === 'left' ? (
        <AppIcon name={icon} activeName={activeIcon} size={iconSizes[size]} />
      ) : null}

      {children}

      {!isLoading && icon && iconPosition === 'right' && (
        <AppIcon name={icon} activeName={activeIcon} size={iconSizes[size]} />
      )}
    </button>
  );

  if (effectiveTooltip) {
    return (
      <Tooltip content={effectiveTooltip} position={tooltipPosition} disabled={disabled}>
        {buttonElement}
      </Tooltip>
    );
  }

  return buttonElement;
};

export default Button;
