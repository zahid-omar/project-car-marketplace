'use client';

import React from 'react';
import { WifiIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  connectionError: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RealtimeIndicator({
  isConnected,
  connectionError,
  syncStatus,
  className = '',
  showText = false,
  size = 'md'
}: RealtimeIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getStatusIcon = () => {
    if (!isConnected || connectionError) {
      return (
        <ExclamationTriangleIcon 
          className={`${sizeClasses[size]} text-red-500`}
          title={connectionError || 'Connection failed'}
        />
      );
    }

    switch (syncStatus) {
      case 'syncing':
        return (
          <ArrowPathIcon 
            className={`${sizeClasses[size]} text-blue-500 animate-spin`}
            title="Syncing..."
          />
        );
      case 'synced':
        return (
          <CheckCircleIcon 
            className={`${sizeClasses[size]} text-green-500`}
            title="Synced"
          />
        );
      case 'error':
        return (
          <ExclamationTriangleIcon 
            className={`${sizeClasses[size]} text-red-500`}
            title="Sync error"
          />
        );
      case 'idle':
      default:
        return (
          <CloudIcon 
            className={`${sizeClasses[size]} text-gray-400`}
            title="Ready"
          />
        );
    }
  };

  const getStatusText = () => {
    if (!isConnected || connectionError) {
      return 'Offline';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing';
      case 'synced':
        return 'Live';
      case 'error':
        return 'Error';
      case 'idle':
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    if (!isConnected || connectionError) {
      return 'text-red-600';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-600';
      case 'synced':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'idle':
      default:
        return 'text-gray-500';
    }
  };

  const getTooltipMessage = () => {
    if (connectionError) {
      return `Connection error: ${connectionError}`;
    }

    if (!isConnected) {
      return 'Real-time updates are offline';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing favorites in real-time...';
      case 'synced':
        return 'Favorites are synchronized in real-time';
      case 'error':
        return 'There was an error syncing favorites';
      case 'idle':
      default:
        return 'Real-time updates are ready';
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 ${className}`}
      title={getTooltipMessage()}
    >
      <div className="relative">
        {getStatusIcon()}
        
        {/* Connection status dot */}
        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
          isConnected && !connectionError 
            ? 'bg-green-400' 
            : 'bg-red-400'
        }`} />
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}

// Alternative compact version for status bars
export function CompactRealtimeIndicator({
  isConnected,
  connectionError,
  syncStatus
}: Pick<RealtimeIndicatorProps, 'isConnected' | 'connectionError' | 'syncStatus'>) {
  const isOnline = isConnected && !connectionError;
  const isSyncing = syncStatus === 'syncing';
  const hasError = syncStatus === 'error' || connectionError;

  return (
    <div className="flex items-center gap-1">
      {/* Connection dot */}
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-400' : 'bg-red-400'
      }`} />
      
      {/* Sync indicator */}
      {isSyncing && (
        <ArrowPathIcon className="w-3 h-3 text-blue-500 animate-spin" />
      )}
      
      {hasError && (
        <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
      )}
    </div>
  );
}

// Status badge for dashboard
export function RealtimeStatusBadge({
  isConnected,
  connectionError,
  syncStatus,
  onClick
}: RealtimeIndicatorProps & { onClick?: () => void }) {
  const isOnline = isConnected && !connectionError;
  const isSyncing = syncStatus === 'syncing';
  const hasError = syncStatus === 'error' || connectionError;

  const getBadgeStyle = () => {
    if (hasError) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (isSyncing) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (isOnline) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusLabel = () => {
    if (hasError) return 'Error';
    if (isSyncing) return 'Syncing';
    if (isOnline) return 'Live';
    return 'Offline';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors hover:opacity-80 ${getBadgeStyle()}`}
      title={hasError ? (connectionError || 'Sync error') : 'Real-time status'}
    >
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-current' : 'bg-red-400'
      }`} />
      
      {isSyncing && (
        <ArrowPathIcon className="w-3 h-3 animate-spin" />
      )}
      
      <span>{getStatusLabel()}</span>
    </button>
  );
}

// Toast notification for connection changes
export function RealtimeToast({
  isConnected,
  connectionError,
  onDismiss
}: {
  isConnected: boolean;
  connectionError: string | null;
  onDismiss: () => void;
}) {
  const isOffline = !isConnected || connectionError;

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Connection Lost
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {connectionError || 'Real-time updates are currently unavailable. Changes will sync when connection is restored.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 