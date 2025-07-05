'use client';

import { ReactNode } from 'react';
import Navigation from '@/components/Navigation';
import { ToastContainer, useToast } from '@/components/ToastNotification';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  navigationVariant?: 'default' | 'transparent';
  className?: string;
  surfaceLevel?: 'surface' | 'surface-container' | 'surface-container-low' | 'surface-container-high';
}

export default function AppLayout({ 
  children, 
  showNavigation = true, 
  navigationVariant = 'default',
  className = '',
  surfaceLevel = 'surface'
}: AppLayoutProps) {
  const { toasts, dismissToast } = useToast();

  const surfaceClasses = {
    'surface': 'bg-md-sys-surface text-md-sys-on-surface',
    'surface-container': 'bg-md-sys-surface-container text-md-sys-on-surface',
    'surface-container-low': 'bg-md-sys-surface-container-low text-md-sys-on-surface',
    'surface-container-high': 'bg-md-sys-surface-container-high text-md-sys-on-surface'
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      surfaceClasses[surfaceLevel],
      className
    )}>
      {showNavigation && (
        <Navigation variant={navigationVariant} />
      )}
      
      <main className={cn(
        'flex-1 flex flex-col',
        showNavigation ? 'pt-0' : 'min-h-screen'
      )}>
        {children}
      </main>
      
      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={dismissToast} 
      />
    </div>
  );
}

// Export the useToast hook for components to use
export { useToast }; 