import React from 'react';
import { Skeleton } from './Skeleton';

interface InlineLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  width?: string;
}

/**
 * Inline loader for button or small component states
 * Replaces spinning icon with skeleton while loading
 */
export const InlineLoader = React.memo(({
  isLoading,
  children,
  size = 'md',
  width = '60px',
}: InlineLoaderProps) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  const heightMap = {
    sm: '16px',
    md: '20px',
    lg: '24px',
  };

  return (
    <Skeleton
      width={width}
      height={heightMap[size]}
      className="rounded-md"
    />
  );
});

InlineLoader.displayName = 'InlineLoader';

/**
 * Replacement for conditional icon loading
 * Shows skeleton loader while isLoading is true, otherwise shows fallback
 */
export const ConditionalIconLoader = React.memo(({
  isLoading,
  fallback = null,
}: {
  isLoading: boolean;
  fallback?: React.ReactNode;
}) => {
  if (isLoading) {
    return <Skeleton width="20px" height="20px" variant="rectangular" className="rounded-sm" />;
  }
  return <>{fallback}</>;
});

ConditionalIconLoader.displayName = 'ConditionalIconLoader';
