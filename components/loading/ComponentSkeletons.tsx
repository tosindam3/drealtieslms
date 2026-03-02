import React from 'react';
import { Skeleton } from './Skeleton';

interface ButtonSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Button skeleton loader for inline loading states
 * Used when buttons show loading indicators
 */
export const ButtonSkeleton = React.memo(({ size = 'md', className = '' }: ButtonSkeletonProps) => {
  const sizes = {
    sm: { width: '60px', height: '20px' },
    md: { width: '80px', height: '24px' },
    lg: { width: '120px', height: '32px' },
  };

  const { width, height } = sizes[size];

  return (
    <Skeleton
      width={width}
      height={height}
      variant="rectangular"
      className={`rounded-md ${className}`}
    />
  );
});

ButtonSkeleton.displayName = 'ButtonSkeleton';

interface CardSkeletonProps {
  variant?: 'minimal' | 'default' | 'detailed';
  className?: string;
}

/**
 * Card skeleton loader for content cards
 */
export const CardSkeleton = React.memo(({ variant = 'default', className = '' }: CardSkeletonProps) => {
  if (variant === 'minimal') {
    return (
      <div className={`p-4 bg-[#161b22]/40 rounded-lg border border-white/5 space-y-3 ${className}`}>
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="100%" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-6 bg-[#161b22]/40 rounded-lg border border-white/5 space-y-4 ${className}`}>
        <Skeleton height={24} width="70%" />
        <Skeleton variant="rectangular" height={200} width="100%" className="rounded-lg" />
        <div className="space-y-2">
          <Skeleton height={14} width="100%" />
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="85%" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton height={40} width="100%" />
          <Skeleton height={40} width="100%" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-[#161b22]/40 rounded-lg border border-white/5 space-y-3 ${className}`}>
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="100%" className="mt-2" />
        </div>
      </div>
      <Skeleton height={12} width="100%" />
      <Skeleton height={12} width="80%" />
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Table skeleton loader
 */
export const TableSkeleton = React.memo(({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) => {
  return (
    <div className={`border border-white/5 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="grid gap-4 bg-[#161b22]/40 p-4 border-b border-white/5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} width="80%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-4 p-4 border-b border-white/5 hover:bg-[#161b22]/20 transition-colors"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} height={14} width={colIdx === 0 ? "100%" : "85%"} />
          ))}
        </div>
      ))}
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';
