import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rect: 'rounded-btn',
    circle: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-surface-elevated/70 border border-surface-border/40 ${variantClasses[variant]} ${className}`}
    />
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" width="70%" height={24} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rect" width={70} height={24} />
        <Skeleton variant="rect" width={60} height={24} />
      </div>
    </div>
  );
};

export default Skeleton;
