'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'surface';
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'primary' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2', 
    lg: 'w-8 h-8 border-[3px]'
  };

  const colorClasses = {
    primary: 'border-md-sys-outline/20 border-t-md-sys-primary',
    secondary: 'border-md-sys-outline/20 border-t-md-sys-secondary',
    surface: 'border-md-sys-outline-variant/30 border-t-md-sys-on-surface'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div 
        className={cn(
          'rounded-full animate-spin',
          'transition-all duration-md-short2 ease-md-standard',
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label="Loading..."
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
} 