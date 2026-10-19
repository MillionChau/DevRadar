import React from 'react';
import { AppIcon, IconName } from './Icon';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'tech' | 'reputation' | 'toxicity' | 'role' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  icon?: IconName;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'tech',
  size = 'md',
  icon,
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 rounded-badge gap-1 font-mono",
    md: "text-xs px-2.5 py-1 rounded-badge gap-1.5 font-medium",
  };

  const variantClasses = {
    tech: "bg-surface-elevated text-brand-secondary border border-surface-border hover:border-brand-secondary/40 font-mono",
    reputation: "bg-brand-primary/15 text-brand-secondary border border-brand-primary/30 font-mono",
    toxicity: "bg-status-danger/15 text-status-danger border border-status-danger/30 font-semibold",
    role: "bg-brand-primary text-white font-bold tracking-wider uppercase text-[10px]",
    success: "bg-status-success/15 text-status-success border border-status-success/30 font-semibold",
    warning: "bg-status-warning/15 text-status-warning border border-status-warning/30 font-semibold",
    danger: "bg-status-danger/15 text-status-danger border border-status-danger/30 font-semibold",
  };

  const isClickable = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center select-none ${sizeClasses[size]} ${variantClasses[variant]} ${
        isClickable ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {icon && <AppIcon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
};

export const TechTagBadge: React.FC<{ tag: string; onClick?: () => void }> = ({ tag, onClick }) => (
  <Badge variant="tech" size="sm" onClick={onClick}>
    #{tag}
  </Badge>
);

export const ToxicityBadge: React.FC<{ score?: number }> = ({ score = 0 }) => {
  if (score < 0.2) {
    return (
      <Badge variant="success" size="sm" icon="CheckCircle">
        Safe ({(score * 100).toFixed(0)}%)
      </Badge>
    );
  }
  if (score < 0.6) {
    return (
      <Badge variant="warning" size="sm" icon="AlertTriangle">
        Notice ({(score * 100).toFixed(0)}%)
      </Badge>
    );
  }
  return (
    <Badge variant="danger" size="sm" icon="AlertTriangle">
      Toxic ({(score * 100).toFixed(0)}%)
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const getRoleVariant = () => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'moderator':
        return 'warning';
      default:
        return 'role';
    }
  };

  return (
    <Badge variant={getRoleVariant()} size="sm">
      {role}
    </Badge>
  );
};

export const ReputationBadge: React.FC<{ score: number }> = ({ score }) => (
  <Badge variant="reputation" size="sm" icon="Star">
    {score >= 0 ? `+${score}` : `${score}`} rep
  </Badge>
);

export default Badge;
