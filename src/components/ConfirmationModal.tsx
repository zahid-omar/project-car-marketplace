'use client';

import { useState, useEffect } from 'react';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: 'exclamation-triangle' | 'question-mark-circle' | 'check-circle' | 'trash' | 'currency-dollar';
  children?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon,
  children
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      case 'danger':
        return {
          iconBg: 'bg-md-sys-error-container',
          iconColor: 'text-md-sys-on-error-container',
          confirmBg: 'bg-md-sys-error',
          confirmHover: 'hover:bg-md-sys-error/90',
          confirmText: 'text-md-sys-on-error',
          confirmRing: 'focus:ring-md-sys-error/20'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBg: 'bg-amber-600',
          confirmHover: 'hover:bg-amber-600/90',
          confirmText: 'text-white',
          confirmRing: 'focus:ring-amber-600/20'
        };
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          confirmBg: 'bg-green-600',
          confirmHover: 'hover:bg-green-600/90',
          confirmText: 'text-white',
          confirmRing: 'focus:ring-green-600/20'
        };
      default:
        return {
          iconBg: 'bg-md-sys-primary-container',
          iconColor: 'text-md-sys-on-primary-container',
          confirmBg: 'bg-md-sys-primary',
          confirmHover: 'hover:bg-md-sys-primary/90',
          confirmText: 'text-md-sys-on-primary',
          confirmRing: 'focus:ring-md-sys-primary/20'
        };
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'danger':
        return 'exclamation-triangle';
      case 'warning':
        return 'exclamation-triangle';
      case 'success':
        return 'check-circle';
      default:
        return 'question-mark-circle';
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
        className="relative bg-md-sys-surface-container-high rounded-3xl shadow-md-elevation-3 w-full max-w-md mx-auto border border-md-sys-outline-variant"
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

        {/* Content */}
        {children && (
          <div className="px-6 pb-4">
            {children}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-md-sys-outline-variant">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-md-sys-outline-variant bg-md-sys-surface-container text-md-sys-on-surface hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium shadow-md-elevation-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 text-md-label-large font-medium shadow-md-elevation-2 ${styles.confirmBg} ${styles.confirmHover} ${styles.confirmText} ${styles.confirmRing}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
