'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className,
    variant = 'elevated',
    elevation,
    interactive = false,
    children,
    ...props 
  }, ref) => {
    
    // Determine elevation based on variant and explicit prop
    const getElevation = () => {
      if (elevation !== undefined) return elevation;
      
      switch (variant) {
        case 'elevated':
          return 1;
        case 'filled':
        case 'outlined':
          return 0;
        default:
          return 1;
      }
    };

    const cardElevation = getElevation();

    const baseClasses = `
      rounded-xl transition-all duration-md-short3 ease-md-standard
      relative overflow-hidden
    `;

    const variantClasses = {
      elevated: `
        surface-container-low
        shadow-md-elevation-${cardElevation}
        ${interactive ? 'hover:shadow-md-elevation-2 cursor-pointer' : ''}
      `,
      filled: `
        surface-container-highest
        shadow-md-elevation-${cardElevation}
        ${interactive ? 'hover:shadow-md-elevation-1 cursor-pointer' : ''}
      `,
      outlined: `
        surface-container-lowest
        border border-md-sys-outline-variant
        shadow-md-elevation-${cardElevation}
        ${interactive ? 'hover:shadow-md-elevation-1 cursor-pointer' : ''}
      `
    };

    const interactiveClasses = interactive ? `
      state-layer
      hover:shadow-md-elevation-2
      focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2
      active:shadow-md-elevation-1
    ` : '';

    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          interactiveClasses,
          className
        )}
        ref={ref}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pb-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, level = 2, ...props }, ref) => {
    const Component = `h${level}` as const;
    
    const levelClasses = {
      1: 'text-md-headline-large',
      2: 'text-md-headline-medium', 
      3: 'text-md-headline-small'
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          'font-heading font-medium text-md-sys-on-surface',
          levelClasses[level],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-md-body-medium text-md-sys-on-surface-variant',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardTitle, 
  CardDescription 
}; 