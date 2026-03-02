import React from 'react';
import { PageSkeleton } from './PageSkeleton';
import { CardSkeleton, ButtonSkeleton } from './ComponentSkeletons';

interface UseLoadingStateProps {
  isLoading: boolean;
  data?: any;
  error?: Error | null;
  fallback?: React.ReactNode;
}

/**
 * Hook to manage loading states with skeleton fallback
 * Provides consistent loading experience across the app
 */
export const useLoadingState = ({
  isLoading,
  data,
  error,
  fallback = <PageSkeleton type="content" count={3} />,
}: UseLoadingStateProps) => {
  return {
    isLoading,
    isError: !!error,
    isReady: !isLoading && data !== undefined,
    fallback,
    error,
  };
};

interface WithSkeletonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  type?: 'page' | 'card' | 'button';
}

/**
 * HOC to wrap components with skeleton loading
 * Ensures consistent loading behavior
 */
export const WithSkeletonLoader: React.FC<WithSkeletonLoaderProps> = ({
  isLoading,
  children,
  skeleton,
  type = 'page',
}) => {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'button':
        return <ButtonSkeleton />;
      case 'page':
      default:
        return <PageSkeleton type="content" />;
    }
  }

  return <>{children}</>;
};

/**
 * Factory function to create optimized page loaders for different page types
 */
export const createPageLoader = (type: 'dashboard' | 'profile' | 'list' | 'content', className?: string) => {
  return () => <PageSkeleton type={type} className={className} />;
};

/**
 * Factory function for card loaders
 */
export const createCardLoader = (variant: 'minimal' | 'default' | 'detailed' = 'default', className?: string) => {
  return () => <CardSkeleton variant={variant} className={className} />;
};

/**
 * Memoized full page loader component for common pages
 */
export const FullPageSkeletonLoader = React.memo(() => (
  <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
    <PageSkeleton type="dashboard" />
  </div>
));

FullPageSkeletonLoader.displayName = 'FullPageSkeletonLoader';

/**
 * Centered skeleton loader for modal/overlay loading states
 */
export const CenteredSkeletonLoader = React.memo(({ height = '60vh' }: { height?: string }) => (
  <div className={`w-full flex items-center justify-center`} style={{ height }}>
    <PageSkeleton type="content" count={1} />
  </div>
));

CenteredSkeletonLoader.displayName = 'CenteredSkeletonLoader';

/**
 * Inline button loading state with skeleton
 */
export const InlineButtonLoader = React.memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <ButtonSkeleton size={size} />
));

InlineButtonLoader.displayName = 'InlineButtonLoader';
