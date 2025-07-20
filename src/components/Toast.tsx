'use client'

import { useState, useEffect } from 'react'
import { MaterialYouIcon } from './ui/MaterialYouIcon'

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  onClose: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

const TOAST_STYLES = {
  success: {
    container: 'bg-md-sys-tertiary-container border-md-sys-tertiary/20',
    icon: 'text-md-sys-tertiary',
    text: 'text-md-sys-on-tertiary-container',
    iconName: 'check-circle' as const,
  },
  error: {
    container: 'bg-md-sys-error-container border-md-sys-error/20',
    icon: 'text-md-sys-error',
    text: 'text-md-sys-on-error-container',
    iconName: 'exclamation-circle' as const,
  },
  warning: {
    container: 'bg-md-sys-secondary-container border-md-sys-secondary/20',
    icon: 'text-md-sys-secondary',
    text: 'text-md-sys-on-secondary-container',
    iconName: 'exclamation-triangle' as const,
  },
  info: {
    container: 'bg-md-sys-primary-container border-md-sys-primary/20',
    icon: 'text-md-sys-primary',
    text: 'text-md-sys-on-primary-container',
    iconName: 'information-circle' as const,
  },
}

export default function Toast({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose,
  action 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const styles = TOAST_STYLES[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 200)
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 w-80 max-w-sm
        ${styles.container}
        border rounded-2xl shadow-md-elevation-3
        transform transition-all duration-200 ease-in-out
        ${isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <MaterialYouIcon 
            name={styles.iconName} 
            className={`w-5 h-5 ${styles.icon} mr-3 mt-0.5 flex-shrink-0`} 
          />
          <div className="flex-1 min-w-0">
            <p className={`text-md-label-large font-medium ${styles.text} mb-1`}>
              {title}
            </p>
            <p className={`text-md-body-medium ${styles.text} leading-5`}>
              {message}
            </p>
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  mt-3 text-md-label-medium font-medium ${styles.icon}
                  hover:underline focus:outline-none focus:underline
                `}
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className={`
              ml-3 p-1 -mr-1 -mt-1 rounded-lg
              ${styles.icon} hover:bg-black/5 focus:outline-none focus:bg-black/10
              transition-colors duration-150
            `}
            aria-label="Dismiss notification"
          >
            <MaterialYouIcon name="x-mark" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Context and Provider for global toast management
import React, { createContext, useContext, useCallback } from 'react'

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => void
  showAuthError: (error: Error, provider?: string) => void
  showAuthSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id, onClose: () => removeToast(id) }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showAuthError = useCallback((error: Error, provider?: string) => {
    const providerText = provider ? ` with ${provider}` : ''
    showToast({
      type: 'error',
      title: `Sign-in Failed${providerText}`,
      message: error.message,
      duration: 6000,
      action: {
        label: 'Try Again',
        onClick: () => {
          // Could trigger a retry mechanism here
          console.log('Retry authentication')
        }
      }
    })
  }, [showToast])

  const showAuthSuccess = useCallback((message: string) => {
    showToast({
      type: 'success',
      title: 'Sign-in Successful',
      message,
      duration: 3000,
    })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showAuthError, showAuthSuccess }}>
      {children}
      {/* Render all toasts */}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
