'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'outlined' | 'filled';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    helperText,
    error,
    variant = 'outlined',
    leadingIcon,
    trailingIcon,
    onTrailingIconClick,
    placeholder,
    disabled,
    required,
    value,
    ...props
  }, ref) => {
    
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined ? String(value).length > 0 : false;
    const hasLabel = Boolean(label);
    const labelFloated = isFocused || hasValue || Boolean(placeholder);

    const containerClasses = cn(
      'relative',
      disabled && 'opacity-60 cursor-not-allowed'
    );

    const inputClasses = cn(
      // Base styles
      'peer w-full bg-transparent transition-all duration-md-short3 ease-md-standard',
      'focus:outline-none',
      'disabled:cursor-not-allowed',
      
      // Typography
      'text-md-body-large text-md-sys-on-surface',
      
      // Spacing based on variant and label
      variant === 'outlined' ? (
        hasLabel ? 'px-4 pt-4 pb-2' : 'px-4 py-3'
      ) : (
        hasLabel ? 'px-4 pt-6 pb-2' : 'px-4 py-4'
      ),
      
      // Leading icon spacing
      leadingIcon && 'pl-12',
      
      // Trailing icon spacing  
      trailingIcon && 'pr-12',
      
      // Variant styles
      variant === 'outlined' && cn(
        'border border-md-sys-outline rounded-md-shape-corner-extra-small',
        'hover:border-md-sys-on-surface',
        'focus:border-md-sys-primary focus:border-2',
        error && 'border-md-sys-error focus:border-md-sys-error'
      ),
      
      variant === 'filled' && cn(
        'bg-md-sys-surface-container-highest rounded-t-md-shape-corner-extra-small',
        'border-b-2 border-md-sys-outline',
        'hover:border-b-md-sys-on-surface',
        'focus:border-b-md-sys-primary',
        error && 'border-b-md-sys-error focus:border-b-md-sys-error'
      ),
      
      className
    );

    const labelClasses = cn(
      'absolute transition-all duration-md-short3 ease-md-standard pointer-events-none',
      'text-md-sys-on-surface-variant',
      
      // Label positioning based on variant and state
      variant === 'outlined' && (
        labelFloated ? (
          'top-0 left-3 -translate-y-1/2 px-1 bg-md-sys-surface text-md-label-small'
        ) : (
          'top-1/2 left-4 -translate-y-1/2 text-md-body-large'
        )
      ),
      
      variant === 'filled' && (
        labelFloated ? (
          'top-2 left-4 text-md-label-small'
        ) : (
          'top-1/2 left-4 -translate-y-1/2 text-md-body-large'
        )
      ),
      
      // Focus and error states
      isFocused && 'text-md-sys-primary',
      error && 'text-md-sys-error',
      disabled && 'text-md-sys-on-surface/40'
    );

    const helperTextClasses = cn(
      'mt-1 text-md-body-small transition-colors duration-md-short2',
      error ? 'text-md-sys-error' : 'text-md-sys-on-surface-variant'
    );

    const iconClasses = 'h-5 w-5 text-md-sys-on-surface-variant';

    return (
      <div className={containerClasses}>
        <div className="relative">
          {/* Leading Icon */}
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <span className={iconClasses}>
                {leadingIcon}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            className={inputClasses}
            placeholder={hasLabel ? undefined : placeholder}
            disabled={disabled}
            required={required}
            value={value}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Floating Label */}
          {hasLabel && (
            <label className={labelClasses}>
              {label}
              {required && (
                <span className="text-md-sys-error ml-1" aria-hidden="true">*</span>
              )}
            </label>
          )}

          {/* Trailing Icon */}
          {trailingIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              {onTrailingIconClick ? (
                <button
                  type="button"
                  onClick={onTrailingIconClick}
                  className="p-1 rounded-full hover:bg-md-sys-on-surface/8 transition-colors duration-md-short2"
                  disabled={disabled}
                >
                  <span className={iconClasses}>
                    {trailingIcon}
                  </span>
                </button>
              ) : (
                <span className={iconClasses}>
                  {trailingIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Helper/Error Text */}
        {(helperText || error) && (
          <div className={helperTextClasses}>
            <div className="flex items-start gap-1">
              {error && (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{error || helperText}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input }; 