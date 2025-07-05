'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/auth';
import { InAppNotification, NotificationState } from '@/types/messages';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseNotificationsProps {
  userId: string | null;
  autoFetch?: boolean;
}

export function useNotifications({ userId, autoFetch = true }: UseNotificationsProps) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options?: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean; 
  }) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.unreadOnly) params.append('unread_only', 'true');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        notifications: data.notifications || [],
        unreadCount: data.unread_count || 0,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load notifications',
        loading: false
      }));
    }
  }, [userId]);

  // Add new notification to state
  const addNotification = useCallback((notification: InAppNotification) => {
    setState(prev => {
      // Check if notification already exists
      const exists = prev.notifications.some(n => n.id === notification.id);
      if (exists) return prev;

      return {
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: notification.is_read ? prev.unreadCount : prev.unreadCount + 1
      };
    });
  }, []);

  // Update notification in state
  const updateNotificationInState = useCallback((notificationId: string, updates: Partial<InAppNotification>) => {
    setState(prev => {
      const updatedNotifications = prev.notifications.map(notification => {
        if (notification.id === notificationId) {
          const updated = { ...notification, ...updates };
          return updated;
        }
        return notification;
      });

      // Recalculate unread count
      const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;

      return {
        ...prev,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount
      };
    });
  }, []);

  // Remove notification from state
  const removeNotificationFromState = useCallback((notificationId: string) => {
    setState(prev => {
      const filteredNotifications = prev.notifications.filter(n => n.id !== notificationId);
      const newUnreadCount = filteredNotifications.filter(n => !n.is_read).length;

      return {
        ...prev,
        notifications: filteredNotifications,
        unreadCount: newUnreadCount
      };
    });
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: notificationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state immediately
      notificationIds.forEach(id => {
        updateNotificationInState(id, { 
          is_read: true, 
          read_at: new Date().toISOString() 
        });
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }, [updateNotificationInState]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?mark_all=true', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString()
        })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, []);

  // Create a new notification
  const createNotification = useCallback(async (notificationData: {
    user_id: string;
    type: 'message' | 'reply' | 'mention' | 'system';
    title: string;
    message: string;
    action_url?: string;
    action_label?: string;
    priority?: 'low' | 'medium' | 'high';
    related_entity_id?: string;
    related_entity_type?: 'message' | 'listing' | 'user';
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const data = await response.json();
      return data.notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    let isActive = true; // Flag to prevent state updates after cleanup
    let setupTimeout: NodeJS.Timeout;

    // Clear any existing subscriptions first
    if (channelRef.current) {
      console.log('Cleaning up existing notifications channel');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
    }

    // Add a small delay to ensure cleanup is complete
    setupTimeout = setTimeout(() => {
      if (!isActive) return; // Don't setup if component unmounted
      
      // Create a unique channel name to avoid conflicts
      const channelName = `user_notifications_${userId}_${Date.now()}`;
      
      // Subscribe to new notifications for this user
      const notificationsChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'in_app_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (!isActive) return; // Don't process if component unmounted
            
            console.log('New notification received:', payload.new);
            addNotification(payload.new as InAppNotification);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'in_app_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (!isActive) return; // Don't process if component unmounted
            
            console.log('Notification updated:', payload.new);
            updateNotificationInState(payload.new.id, payload.new as Partial<InAppNotification>);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'in_app_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (!isActive) return; // Don't process if component unmounted
            
            console.log('Notification deleted:', payload.old);
            removeNotificationFromState(payload.old.id);
          }
        )
        .subscribe((status) => {
          if (isActive) {
            console.log('Notifications subscription status:', status);
          }
        });

      if (isActive) {
        channelRef.current = notificationsChannel;
      }
    }, 150); // Slightly longer delay to avoid conflicts with messages channel

    // Cleanup function
    return () => {
      isActive = false; // Mark as inactive to prevent state updates
      clearTimeout(setupTimeout);
      
      if (channelRef.current) {
        console.log('Cleaning up notifications subscription on unmount');
        const channelToRemove = channelRef.current;
        channelRef.current = null;
        
        // Use a longer timeout to ensure proper cleanup
        setTimeout(() => {
          try {
            if (channelToRemove && channelToRemove.state !== 'closed') {
              supabase.removeChannel(channelToRemove);
            }
          } catch (error) {
            // Ignore cleanup errors - connection might already be closed
          }
        }, 200);
      }
    };
  }, [userId, addNotification, updateNotificationInState, removeNotificationFromState]);

  // Auto-fetch notifications on mount
  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications();
    }
  }, [autoFetch, userId, fetchNotifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return state.notifications.filter(n => !n.is_read);
  }, [state.notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: string) => {
    return state.notifications.filter(n => n.type === type);
  }, [state.notifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: 'low' | 'medium' | 'high') => {
    return state.notifications.filter(n => n.priority === priority);
  }, [state.notifications]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    // Getters
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    // State management
    refreshNotifications: () => fetchNotifications()
  };
} 