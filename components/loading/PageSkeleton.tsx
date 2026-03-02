import React from 'react';
import { Skeleton } from './Skeleton';

interface PageSkeletonProps {
  type?: 'dashboard' | 'profile' | 'list' | 'content' | 'custom';
  className?: string;
  count?: number;
}

/**
 * Full page skeleton loader
 * Used for initial page load states
 */
export const PageSkeleton = React.memo(({ type = 'dashboard', className = '', count = 1 }: PageSkeletonProps) => {
  if (type === 'dashboard') {
    return (
      <div className={`space-y-6 p-4 sm:p-6 lg:p-10 ${className}`}>
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton height={28} width="60%" />
          <Skeleton height={16} width="100%" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 bg-[#161b22]/40 rounded-lg border border-white/5">
              <Skeleton height={16} width="70%" />
              <Skeleton height={24} width="50%" />
              <Skeleton height={12} width="100%" />
            </div>
          ))}
        </div>

        {/* Recent activity skeleton */}
        <div className="space-y-3 p-4 bg-[#161b22]/40 rounded-lg border border-white/5">
          <Skeleton height={20} width="30%" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-2">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="100%" className="mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className={`space-y-6 p-4 sm:p-6 lg:p-10 ${className}`}>
        {/* Profile header */}
        <div className="flex flex-col md:flex-row gap-6 bg-[#161b22]/40 p-6 rounded-lg border border-white/5">
          <Skeleton variant="circular" width={160} height={160} />
          <div className="flex-1 space-y-3">
            <Skeleton height={24} width="50%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="70%" />
            <div className="flex gap-2 pt-4">
              <Skeleton width={100} height={40} />
              <Skeleton width={100} height={40} />
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#161b22]/40 p-4 rounded-lg border border-white/5">
                <Skeleton height={20} width="40%" className="mb-3" />
                <Skeleton height={16} width="100%" />
                <Skeleton height={16} width="90%" className="mt-2" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#161b22]/40 p-3 rounded-lg border border-white/5">
                <Skeleton height={16} width="60%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-[#161b22]/40 rounded-lg border border-white/5">
            <Skeleton variant="circular" width={50} height={50} />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} width="50%" />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="80%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'content') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Title */}
        <Skeleton height={28} width="70%" />
        
        {/* Paragraphs */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height={16} width="100%" />
            <Skeleton height={16} width="95%" />
            <Skeleton height={16} width="90%" />
          </div>
        ))}

        {/* Image */}
        <Skeleton height={300} width="100%" className="rounded-xl mt-6" />
      </div>
    );
  }

  return null;
});

PageSkeleton.displayName = 'PageSkeleton';
