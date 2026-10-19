import React from 'react';
import { AppIcon, IconName } from './Icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
  leftIcon?: IconName;
  iconRight?: IconName;
  rightIcon?: IconName;
  onRightIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  leftIcon,
  iconRight,
  rightIcon,
  onRightIconClick,
  className = '',
  disabled,
  ...props
}) => {
  const effectiveLeftIcon = leftIcon || icon;
  const effectiveRightIcon = rightIcon || iconRight;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text-muted select-none">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {effectiveLeftIcon && (
          <div className="absolute left-3 text-text-subtle pointer-events-none flex items-center justify-center">
            <AppIcon name={effectiveLeftIcon} size={16} />
          </div>
        )}

        <input
          disabled={disabled}
          className={`w-full bg-surface-elevated border text-text-main text-sm rounded-btn transition-colors duration-150 placeholder:text-text-subtle focus:outline-none focus:ring-1 focus:ring-brand-primary ${
            effectiveLeftIcon ? 'pl-9' : 'pl-3.5'
          } ${effectiveRightIcon ? 'pr-9' : 'pr-3.5'} py-2.5 h-10 ${
            error
              ? 'border-status-danger focus:border-status-danger focus:ring-status-danger'
              : 'border-surface-border focus:border-brand-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-bg' : ''} ${className}`}
          {...props}
        />

        {effectiveRightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 text-text-subtle hover:text-text-muted transition-colors flex items-center justify-center focus:outline-none"
          >
            <AppIcon name={effectiveRightIcon} size={16} />
          </button>
        )}
      </div>

      {error ? (
        <span className="text-xs text-status-danger flex items-center gap-1">
          <AppIcon name="alert" size={12} />
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-text-subtle">{helperText}</span>
      ) : null}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text-muted select-none">
          {label}
        </label>
      )}
      <textarea
        disabled={disabled}
        className={`w-full bg-surface-elevated border text-text-main text-sm rounded-btn transition-colors duration-150 placeholder:text-text-subtle p-3 focus:outline-none focus:ring-1 focus:ring-brand-primary ${
          error
            ? 'border-status-danger focus:border-status-danger focus:ring-status-danger'
            : 'border-surface-border focus:border-brand-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-bg' : ''} ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-status-danger flex items-center gap-1">
          <AppIcon name="alert" size={12} />
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-text-subtle">{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
