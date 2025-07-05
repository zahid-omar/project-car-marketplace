'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MaterialYouIcon } from './MaterialYouIcon';
import { useRipple } from '@/hooks/useAnimations';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'filled-tonal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = 'filled',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    onClick,
    ...props 
  }, ref) => {
    
    const { ref: rippleRef, createRipple } = useRipple();
    
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-full 
      focus:outline-none
      disabled:opacity-60 disabled:cursor-not-allowed
      relative overflow-hidden
      md-button-press md-focus-ring md-transition-standard
    `;

    const sizeClasses = {
      sm: 'px-4 py-2 text-md-label-medium h-8',
      md: 'px-6 py-3 text-md-label-large h-10',
      lg: 'px-8 py-4 text-md-label-large h-12'
    };

    const variantClasses = {
      filled: `
        bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]
        hover:shadow-[var(--md-sys-elevation-level2)]
        active:shadow-[var(--md-sys-elevation-level1)]
      `,
      'filled-tonal': `
        bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]
        hover:shadow-[var(--md-sys-elevation-level2)]
        active:shadow-[var(--md-sys-elevation-level1)]
      `,
      outlined: `
        bg-transparent text-[var(--md-sys-color-primary)]
        border border-[var(--md-sys-color-outline)]
        hover:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_8%,transparent)]
        active:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_12%,transparent)]
      `,
      text: `
        bg-transparent text-[var(--md-sys-color-primary)]
        hover:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_8%,transparent)]
        active:bg-[color-mix(in_srgb,var(--md-sys-color-primary)_12%,transparent)]
      `,
      elevated: `
        bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)]
        shadow-[var(--md-sys-elevation-level1)]
        hover:shadow-[var(--md-sys-elevation-level2)]
        active:shadow-[var(--md-sys-elevation-level1)]
        md-hover-lift
      `
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const isDisabled = disabled || loading;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        createRipple(event);
        onClick?.(event);
      }
    };

    // Merge refs properly
    const mergedRef = (node: HTMLButtonElement) => {
      if (rippleRef) {
        (rippleRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      }
    };

    return (
      <button
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          widthClasses,
          className
        )}
        disabled={isDisabled}
        ref={mergedRef}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <div className="md-spinner w-4 h-4" aria-hidden="true" role="status" aria-label="Loading">
            <span className="sr-only">Loading...</span>
          </div>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span aria-hidden="true" className="md-icon-bounce">{icon}</span>
        )}
        
        <span>{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span aria-hidden="true" className="md-icon-bounce">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button }; 