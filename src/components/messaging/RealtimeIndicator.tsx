'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/auth';
import { Wifi, WifiOff, Circle } from 'lucide-react';

interface RealtimeIndicatorProps {
  className?: string;
}

export default function RealtimeIndicator({ className = '' }: RealtimeIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'OPEN' | 'CLOSED'>('CONNECTING');

  useEffect(() => {
    let mounted = true;
    let hasInitialCheck = false;
    
    // Monitor the connection status
    const checkConnection = () => {
      if (!mounted) return;
      
      const channels = supabase.getChannels();
      const hasActiveChannels = channels.length > 0;
      
      // Check if any channels are properly subscribed
      const hasSubscribedChannels = channels.some(channel => 
        channel.state === 'joined'
      );
      
      // Check if any channels are in the process of joining
      const hasJoiningChannels = channels.some(channel => 
        channel.state === 'joining'
      );
      
      if (hasSubscribedChannels) {
        setIsConnected(true);
        setConnectionState('OPEN');
      } else if (hasJoiningChannels || (hasActiveChannels && !hasInitialCheck)) {
        setIsConnected(false);
        setConnectionState('CONNECTING');
      } else if (hasInitialCheck && !hasActiveChannels) {
        setIsConnected(false);
        setConnectionState('CLOSED');
      }
      
      hasInitialCheck = true;
    };

    // Initial delay to allow subscriptions to establish
    const initialTimeout = setTimeout(() => {
      if (mounted) {
        checkConnection();
      }
    }, 1000); // Longer initial delay

    // Set up interval to check periodically, but less frequently
    const interval = setInterval(() => {
      if (mounted) {
        checkConnection();
      }
    }, 4000); // Less frequent checks

    return () => {
      mounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'OPEN':
        return 'text-green-500';
      case 'CONNECTING':
        return 'text-yellow-500';
      case 'CLOSED':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'OPEN':
        return 'Real-time connected';
      case 'CONNECTING':
        return 'Connecting...';
      case 'CLOSED':
        return 'Real-time disconnected';
      default:
        return 'Checking connection...';
    }
  };

  return (
    <span className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="relative inline-flex items-center">
        {isConnected ? (
          <Wifi className={`h-4 w-4 ${getStatusColor()}`} />
        ) : (
          <WifiOff className={`h-4 w-4 ${getStatusColor()}`} />
        )}
        
        {/* Pulsing indicator for connecting state */}
        {connectionState === 'CONNECTING' && (
          <Circle className="h-2 w-2 absolute -top-1 -right-1 text-yellow-500 animate-pulse" fill="currentColor" />
        )}
      </span>
      
      <span className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </span>
  );
}