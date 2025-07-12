'use client';

import { useState, useEffect } from 'react';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: 'check-circle' | 'exclamation-triangle' | 'information-circle' | 'x-circle';
  autoClose?: boolean;
  autoCloseDelay?: number;
  actionText?: string;
  onAction?: () => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  icon,
  autoClose = true,
  autoCloseDelay = 3000,
  actionText,
  onAction
}: NotificationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          actionBg: 'bg-green-600',
          actionHover: 'hover:bg-green-600/90',
          actionText: 'text-white',
          actionRing: 'focus:ring-green-600/20'
        };
      case 'error':
        return {
          iconBg: 'bg-md-sys-error-container',
          iconColor: 'text-md-sys-on-error-container',
          actionBg: 'bg-md-sys-error',
          actionHover: 'hover:bg-md-sys-error/90',
          actionText: 'text-md-sys-on-error',
          actionRing: 'focus:ring-md-sys-error/20'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          actionBg: 'bg-amber-600',
          actionHover: 'hover:bg-amber-600/90',
          actionText: 'text-white',
          actionRing: 'focus:ring-amber-600/20'
        };
      default:
        return {
          iconBg: 'bg-md-sys-primary-container',
          iconColor: 'text-md-sys-on-primary-container',
          actionBg: 'bg-md-sys-primary',
          actionHover: 'hover:bg-md-sys-primary/90',
          actionText: 'text-md-sys-on-primary',
          actionRing: 'focus:ring-md-sys-primary/20'
        };
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'exclamation-triangle';
      default:
        return 'information-circle';
    }
  };

  const styles = getTypeStyles();
  const iconName = icon || getDefaultIcon();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative bg-md-sys-surface-container-high rounded-3xl shadow-md-elevation-3 w-full max-w-md mx-auto border border-md-sys-outline-variant transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full ${styles.iconBg} flex-shrink-0`}>
              <MaterialYouIcon 
                name={iconName} 
                className={`w-6 h-6 ${styles.iconColor}`}
                aria-hidden={true}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                id="modal-title"
                className="text-md-title-large font-semibold text-md-sys-on-surface mb-2"
              >
                {title}
              </h3>
              <p 
                id="modal-description"
                className="text-md-body-medium text-md-sys-on-surface-variant"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-md-sys-outline-variant">
          <div className="flex justify-end space-x-3">
            {actionText && onAction && (
              <button
                onClick={onAction}
                className={`px-6 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 text-md-label-large font-medium shadow-md-elevation-2 ${styles.actionBg} ${styles.actionHover} ${styles.actionText} ${styles.actionRing}`}
              >
                {actionText}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-md-sys-outline-variant bg-md-sys-surface-container text-md-sys-on-surface hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium shadow-md-elevation-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
