import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  className?: string;
  animated?: boolean;
}

/**
 * Base Skeleton component - renders a shimmer loading placeholder
 * Optimized for performance with minimal re-renders
 */
export const Skeleton = React.memo(({
  width = '100%',
  height = '20px',
  variant = 'rectangular',
  className = '',
  animated = true,
}: SkeletonProps) => {
  const baseClasses = 'bg-gradient-to-r from-[#1a1f26] via-[#232936] to-[#1a1f26] rounded-lg';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  };

  const animationClasses = animated ? 'animate-pulse' : '';

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    />
  );
});

Skeleton.displayName = 'Skeleton';
