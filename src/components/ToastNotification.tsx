'use client';

import React, { useEffect, useState } from 'react';
import { MaterialYouIcon } from './ui/MaterialYouIcon';
import { cn } from '@/lib/utils';
import { useAnimation, useRipple } from '@/hooks/useAnimations';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);
  const { ref: closeButtonRef, createRipple } = useRipple();
  
  // Use Material You toast animations
  const enterAnimation = useAnimation({
    animation: 'toast-enter',
    onComplete: () => {
      // Animation complete
    }
  });

  const exitAnimation = useAnimation({
    animation: 'toast-exit',
    onComplete: () => {
      onDismiss(toast.id);
    }
  });

  useEffect(() => {
    // Trigger entrance animation
    enterAnimation.trigger();

    // Auto-dismiss if not persistent
    if (!toast.persistent && toast.duration !== 0) {
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 5000);

      return () => clearTimeout(dismissTimer);
    }
  }, [toast.duration, toast.persistent, enterAnimation]);

  const handleDismiss = () => {
    setIsExiting(true);
    exitAnimation.trigger();
  };

  const handleCloseClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    handleDismiss();
  };

  const getToastStyles = () => {
    const baseStyles = `
      bg-[var(--md-sys-color-surface-container-high)] 
      text-[var(--md-sys-color-on-surface)]
      shadow-[var(--md-sys-elevation-level3)]
      border border-[var(--md-sys-color-outline-variant)]
    `;

    switch (toast.type) {
      case 'success':
        return cn(baseStyles, 'border-l-4 border-l-green-500');
      case 'error':
        return cn(baseStyles, 'border-l-4 border-l-[var(--md-sys-color-error)]');
      case 'warning':
        return cn(baseStyles, 'border-l-4 border-l-orange-500');
      case 'info':
        return cn(baseStyles, 'border-l-4 border-l-[var(--md-sys-color-primary)]');
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <MaterialYouIcon name="check-circle" className="text-green-500" size="md" />;
      case 'error':
        return <MaterialYouIcon name="error" className="text-[var(--md-sys-color-error)]" size="md" />;
      case 'warning':
        return <MaterialYouIcon name="warning" className="text-orange-500" size="md" />;
      case 'info':
        return <MaterialYouIcon name="info" className="text-[var(--md-sys-color-primary)]" size="md" />;
      default:
        return <MaterialYouIcon name="info" className="text-[var(--md-sys-color-on-surface-variant)]" size="md" />;
    }
  };

  const getIconContainerStyles = () => {
    const baseStyles = 'w-10 h-10 rounded-full flex items-center justify-center mr-3 md-transition-standard';
    
    switch (toast.type) {
      case 'success':
        return cn(baseStyles, 'bg-green-500/10');
      case 'error':
        return cn(baseStyles, 'bg-[var(--md-sys-color-error-container)]');
      case 'warning':
        return cn(baseStyles, 'bg-orange-500/10');
      case 'info':
        return cn(baseStyles, 'bg-[var(--md-sys-color-primary-container)]');
      default:
        return cn(baseStyles, 'bg-[var(--md-sys-color-surface-variant)]');
    }
  };

  // Merge animation ref with component
  const mergedRef = (node: HTMLDivElement) => {
    if (enterAnimation.ref) {
      (enterAnimation.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
    if (exitAnimation.ref) {
      (exitAnimation.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // Merge close button ref
  const mergedCloseRef = (node: HTMLButtonElement) => {
    if (closeButtonRef) {
      (closeButtonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  };

  return (
    <div
      ref={mergedRef}
      className={cn(
        'max-w-sm w-full pointer-events-auto overflow-hidden',
        'rounded-xl',
        'shape-large', // Material You shape token
        getToastStyles()
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon Container with Animation */}
          <div className={cn(getIconContainerStyles(), 'md-fade-in')}>
            {getIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-md-title-small font-medium text-[var(--md-sys-color-on-surface)]">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
                {toast.message}
              </p>
            )}
          </div>
          
          {/* Close Button with Material You animations */}
          <div className="ml-4 flex-shrink-0">
            <button
              ref={mergedCloseRef}
              onClick={handleCloseClick}
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-full',
                'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
                'hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]',
                'active:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_12%,transparent)]',
                'md-button-press md-focus-ring md-transition-quick',
                'relative overflow-hidden' // For ripple effect
              )}
              aria-label="Close notification"
            >
              <MaterialYouIcon name="x-mark" size="sm" className="md-icon-bounce" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container Component with staggered animations
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end md-stagger-children" style={{'--stagger-delay': '100ms'} as React.CSSProperties}>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{'--stagger-index': index} as React.CSSProperties}
            className="md-fade-in"
          >
            <ToastNotification
              toast={toast}
              onDismiss={onDismiss}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const dismissAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options });
  };

  const showError = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, message, ...options });
  };

  const showWarning = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options });
  };

  return {
    toasts,
    addToast,
    dismissToast,
    dismissAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
} 