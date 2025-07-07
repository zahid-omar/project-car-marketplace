'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/auth';
import { ConversationWithDetails, MessageWithProfiles } from '@/types/messages';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMessagingProps {
  userId: string | null;
  activeConversationId?: string | null;
  showToastNotifications?: boolean;
  onNewMessage?: (message: MessageWithProfiles) => void;
}

interface RealtimeMessagingState {
  conversations: ConversationWithDetails[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useRealtimeMessaging({ 
  userId, 
  activeConversationId, 
  showToastNotifications = false, 
  onNewMessage 
}: UseRealtimeMessagingProps) {
  const [state, setState] = useState<RealtimeMessagingState>({
    conversations: [],
    unreadCount: 0,
    loading: true,
    error: null
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Store callbacks in refs to avoid stale closures while maintaining stable dependencies
  const callbacksRef = useRef({
    updateConversationWithMessage,
    updateMessageReadStatus,
    onNewMessage
  });
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      updateConversationWithMessage,
      updateMessageReadStatus,
      onNewMessage
    };
  }, [updateConversationWithMessage, updateMessageReadStatus, onNewMessage]);

  // Fetch initial conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      const conversations = data.conversations || [];
      const unreadCount = conversations.reduce((sum: number, conv: any) => sum + conv.unread_count, 0);
      
      setState(prev => ({
        ...prev,
        conversations,
        unreadCount,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load conversations',
        loading: false
      }));
    }
  }, [userId]);

  // Update conversation with new message - stable dependency
  const updateConversationWithMessage = useCallback((newMessage: MessageWithProfiles) => {
    setState(prev => {
      const updatedConversations = prev.conversations.map(conversation => {
        if (conversation.listing_id === newMessage.listing_id) {
          // Check if this conversation involves the current user
          const isUserInConversation = 
            conversation.other_participant.id === newMessage.sender_id ||
            conversation.other_participant.id === newMessage.recipient_id ||
            newMessage.sender_id === userId ||
            newMessage.recipient_id === userId;

          if (isUserInConversation) {
            const updatedMessages = [...(conversation.messages || [])];
            
            // Avoid duplicates
            const messageExists = updatedMessages.some(msg => msg.id === newMessage.id);
            if (!messageExists) {
              updatedMessages.push(newMessage);
            }

            // Only increment unread count if:
            // 1. The message is for the current user
            // 2. The message is not read
            // 3. The message is not sent by the current user (to avoid counting own messages)
            // 4. This conversation is not currently being viewed (activeConversationId check)
            const shouldIncrementUnread = 
              !newMessage.is_read && 
              newMessage.recipient_id === userId &&
              newMessage.sender_id !== userId &&
              newMessage.listing_id !== activeConversationId;

            const newUnreadCount = shouldIncrementUnread
              ? conversation.unread_count + 1
              : conversation.unread_count;

            // Only log if there's a significant change to avoid console spam
            if (shouldIncrementUnread) {
              console.log(`Message update for conversation ${newMessage.listing_id}: unread ${conversation.unread_count} -> ${newUnreadCount}`);
            }

            return {
              ...conversation,
              messages: updatedMessages,
              last_message_text: newMessage.message_text,
              last_message_created_at: newMessage.created_at,
              unread_count: newUnreadCount
            };
          }
        }
        return conversation;
      });

      // Calculate new total unread count
      const newUnreadCount = updatedConversations.reduce(
        (sum, conv) => sum + conv.unread_count, 0
      );

      return {
        ...prev,
        conversations: updatedConversations,
        unreadCount: newUnreadCount
      };
    });
  }, [userId, activeConversationId]);

  // Update message read status
  const updateMessageReadStatus = useCallback((messageId: string, isRead: boolean) => {
    setState(prev => {
      const updatedConversations = prev.conversations.map(conversation => {
        if (conversation.messages) {
          const updatedMessages = conversation.messages.map(message => {
            if (message.id === messageId) {
              return { ...message, is_read: isRead };
            }
            return message;
          });

          // Recalculate unread count for this conversation
          const unreadCount = updatedMessages.filter(
            msg => !msg.is_read && msg.recipient_id === userId
          ).length;

          return {
            ...conversation,
            messages: updatedMessages,
            unread_count: unreadCount
          };
        }
        return conversation;
      });

      // Calculate new total unread count
      const newUnreadCount = updatedConversations.reduce(
        (sum, conv) => sum + conv.unread_count, 0
      );

      return {
        ...prev,
        conversations: updatedConversations,
        unreadCount: newUnreadCount
      };
    });
  }, [userId]);

  // Set up real-time subscriptions with better stability
  useEffect(() => {
    if (!userId) return;

    let isActive = true; // Flag to prevent state updates after cleanup
    let setupTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    // Clear any existing subscriptions first
    if (channelRef.current) {
      console.log('Cleaning up existing messages channel');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
    }

    const setupSubscription = () => {
      if (!isActive) return; // Don't setup if component unmounted
      
      // Create a unique channel name to avoid conflicts
      const channelName = `user_messages_${userId}_${Date.now()}`;
      
      console.log('Setting up messages subscription:', channelName);
      
      // Subscribe to new messages for this user
      const messagesChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${userId}`
          },
          async (payload) => {
            if (!isActive) return; // Don't process if component unmounted
            
            console.log('New message received:', payload.new);
            try {
              // Fetch the full message with profile data
              const { data: fullMessage, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles!messages_sender_id_fkey(id, display_name, profile_image_url, email),
                  recipient:profiles!messages_recipient_id_fkey(id, display_name, profile_image_url, email),
                  listing:listings(id, title, make, model, year, price, status, user_id)
                `)
                .eq('id', payload.new.id)
                .single();

              if (!error && fullMessage && isActive) {
                callbacksRef.current.updateConversationWithMessage(fullMessage);
                
                // Show toast notification if enabled and it's not the user's own message
                // and they're not currently viewing this conversation
                if (showToastNotifications && callbacksRef.current.onNewMessage && 
                    fullMessage.sender_id !== userId && 
                    fullMessage.listing_id !== activeConversationId) {
                  callbacksRef.current.onNewMessage(fullMessage);
                }
              }
            } catch (error) {
              console.error('Error fetching new message:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${userId}`
          },
          (payload) => {
            if (!isActive) return; // Don't process if component unmounted
            
            console.log('Message updated (read status):', payload.new);
            if (payload.new.is_read && payload.new.read_at) {
              callbacksRef.current.updateMessageReadStatus(payload.new.id, true);
            }
          }
        )
        .subscribe((status) => {
          if (!isActive) return;
          
          console.log('Messages subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time messaging connected successfully');
            reconnectAttempts = 0; // Reset reconnection counter on success
          } else if (status === 'CHANNEL_ERROR' && reconnectAttempts < maxReconnectAttempts) {
            // Attempt to reconnect after a delay
            reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(() => {
              if (isActive && channelRef.current) {
                try {
                  supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                  setTimeout(setupSubscription, 1000);
                } catch (error) {
                  console.error('Error during reconnection:', error);
                }
              }
            }, 2000);
          } else if (status === 'TIMED_OUT') {
            console.log('⚠️ Connection timed out - this is normal during development');
          }
        });

      if (isActive) {
        channelRef.current = messagesChannel;
      }
    };

    // Add a delay to ensure cleanup is complete and handle React StrictMode
    setupTimeout = setTimeout(setupSubscription, 500);

    // Cleanup function
    return () => {
      isActive = false; // Mark as inactive to prevent state updates
      clearTimeout(setupTimeout);
      
      if (channelRef.current) {
        console.log('Cleaning up messages subscription on unmount');
        const channelToRemove = channelRef.current;
        channelRef.current = null;
        
        // Use a longer timeout to ensure proper cleanup
        setTimeout(() => {
          try {
            if (channelToRemove && channelToRemove.state !== 'closed') {
              supabase.removeChannel(channelToRemove);
              console.log('✅ Messages subscription cleaned up');
            }
          } catch (error) {
            // Ignore cleanup errors - connection might already be closed
          }
        }, 100);
      }
    };
      }, [userId, showToastNotifications]); // Removed function dependencies to prevent subscription resets

  // Set up conversation-specific subscription for active conversation (with better error handling)
  useEffect(() => {
    if (!userId || !activeConversationId) {
      // Clean up previous conversation subscription
      if (conversationChannelRef.current) {
        try {
          supabase.removeChannel(conversationChannelRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
        conversationChannelRef.current = null;
      }
      return;
    }

    let isActive = true;
    let setupTimeout: NodeJS.Timeout;

    // Clean up any existing conversation subscription
    if (conversationChannelRef.current) {
      try {
        supabase.removeChannel(conversationChannelRef.current);
      } catch (error) {
        // Ignore cleanup errors
      }
      conversationChannelRef.current = null;
    }

    setupTimeout = setTimeout(() => {
      if (!isActive) return;

      const conversationChannel = supabase
        .channel(`conversation_${activeConversationId}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `listing_id.eq.${activeConversationId}`
          },
          async (payload) => {
            if (!isActive) return;
            
            console.log('Conversation-specific update:', payload);
            
            if (payload.eventType === 'UPDATE' && payload.new.is_read !== payload.old.is_read) {
              callbacksRef.current.updateMessageReadStatus(payload.new.id, payload.new.is_read);
            }
          }
        )
        .subscribe((status) => {
          if (isActive) {
            console.log(`Conversation ${activeConversationId} subscription status:`, status);
            
            if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.log('⚠️ Conversation subscription ended - this is normal during development');
            }
          }
        });

      if (isActive) {
        conversationChannelRef.current = conversationChannel;
      }
    }, 200);

    return () => {
      isActive = false;
      clearTimeout(setupTimeout);
      
      if (conversationChannelRef.current) {
        const channelToRemove = conversationChannelRef.current;
        conversationChannelRef.current = null;
        
        setTimeout(() => {
          try {
            if (channelToRemove && channelToRemove.state !== 'closed') {
              supabase.removeChannel(channelToRemove);
            }
          } catch (error) {
            // Ignore cleanup errors
          }
        }, 50);
      }
    };
  }, [userId, activeConversationId]); // Removed function dependency to prevent subscription resets

  // Load initial data
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Public methods
  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_ids: messageIds })
      });
      
      // Update local state immediately with timestamp
      const now = new Date().toISOString();
      messageIds.forEach(messageId => {
        updateMessageReadStatus(messageId, true);
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      // Check if this conversation already has 0 unread messages to avoid unnecessary API calls
      const conversation = state.conversations.find(conv => conv.listing_id === conversationId);
      if (conversation && conversation.unread_count === 0) {
        return; // Already marked as read, no need to make API call
      }

      const response = await fetch(`/api/messages?conversation_id=${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to mark conversation as read: ${response.status} ${response.statusText}`, errorText);
        return; // Don't update local state if API call failed
      }
      
      // Update local state immediately - set unread count to 0 for this conversation
      setState(prev => {
        const updatedConversations = prev.conversations.map(conversation => {
          if (conversation.listing_id === conversationId) {
            // Mark all messages as read if they exist
            const updatedMessages = conversation.messages?.map(message => {
              if (!message.is_read) {
                return { ...message, is_read: true, read_at: new Date().toISOString() };
              }
              return message;
            }) || [];

            // Force unread count to 0 regardless of message array state
            return {
              ...conversation,
              messages: updatedMessages,
              unread_count: 0
            };
          }
          return conversation;
        });

        // Calculate new total unread count
        const newUnreadCount = updatedConversations.reduce(
          (sum, conv) => sum + conv.unread_count, 0
        );

        // Only log if there's actually a change to avoid console spam
        if (prev.unreadCount !== newUnreadCount) {
          console.log(`Updated unread counts - Conversation ${conversationId}: 0, Total: ${newUnreadCount}`);
        }

        return {
          ...prev,
          conversations: updatedConversations,
          unreadCount: newUnreadCount
        };
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      // Don't throw the error to prevent component crashes
    }
  };

  const sendMessage = async (messageData: any) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // The real-time subscription will handle updating the UI
      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Archive or unarchive conversations
  const archiveConversations = async (conversationIds: string[], archive: boolean = true) => {
    try {
      const response = await fetch('/api/messages?action=archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation_ids: conversationIds,
          archive 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} conversations`);
      }

      // Update local state immediately
      setState(prev => {
        const updatedConversations = prev.conversations.map(conversation => {
          const conversationKey = `${conversation.listing_id}-${conversation.other_participant?.id}`;
          if (conversationIds.includes(conversationKey)) {
            return { ...conversation, is_archived: archive };
          }
          return conversation;
        });

        return {
          ...prev,
          conversations: updatedConversations
        };
      });

      return true;
    } catch (error) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} conversations:`, error);
      throw error;
    }
  };

  // Delete conversations (soft delete by default)
  const deleteConversations = async (conversationIds: string[], hardDelete: boolean = false) => {
    try {
      const response = await fetch(`/api/messages?conversation_ids=${conversationIds.join(',')}&soft_delete=${!hardDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversations');
      }

      // Update local state immediately by removing deleted conversations
      setState(prev => {
        const updatedConversations = prev.conversations.filter(conversation => {
          const conversationKey = `${conversation.listing_id}-${conversation.other_participant?.id}`;
          return !conversationIds.includes(conversationKey);
        });

        // Recalculate unread count
        const newUnreadCount = updatedConversations.reduce(
          (sum, conv) => sum + conv.unread_count, 0
        );

        return {
          ...prev,
          conversations: updatedConversations,
          unreadCount: newUnreadCount
        };
      });

      return true;
    } catch (error) {
      console.error('Error deleting conversations:', error);
      throw error;
    }
  };

  // Search conversations with filters
  const searchConversations = async (searchQuery: string, includeArchived: boolean = false) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (includeArchived) {
        params.append('include_archived', 'true');
      }

      const response = await fetch(`/api/messages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search conversations');
      }
      
      const data = await response.json();
      const conversations = data.conversations || [];
      const unreadCount = conversations.reduce((sum: number, conv: any) => sum + conv.unread_count, 0);
      
      setState(prev => ({
        ...prev,
        conversations,
        unreadCount,
        loading: false
      }));

      return conversations;
    } catch (error) {
      console.error('Error searching conversations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to search conversations',
        loading: false
      }));
      throw error;
    }
  };

  // Fetch conversations with options (enhanced version of fetchConversations)
  const fetchConversationsWithOptions = useCallback(async (options: {
    includeArchived?: boolean;
    search?: string;
  } = {}) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams();
      if (options.search?.trim()) {
        params.append('search', options.search.trim());
      }
      if (options.includeArchived) {
        params.append('include_archived', 'true');
      }

      const response = await fetch(`/api/messages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      const conversations = data.conversations || [];
      const unreadCount = conversations.reduce((sum: number, conv: any) => sum + conv.unread_count, 0);
      
      setState(prev => ({
        ...prev,
        conversations,
        unreadCount,
        loading: false
      }));

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load conversations',
        loading: false
      }));
      throw error;
    }
  }, [userId]);

  // Bulk mark conversations as read
  const markMultipleConversationsAsRead = async (conversationIds: string[]) => {
    try {
      const promises = conversationIds.map(id => markConversationAsRead(id));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error marking multiple conversations as read:', error);
      throw error;
    }
  };

  // Get conversation statistics
  const getConversationStats = useCallback(() => {
    const total = state.conversations.length;
    const unread = state.conversations.filter(conv => conv.unread_count > 0).length;
    const archived = state.conversations.filter(conv => (conv as any).is_archived).length;
    const inbox = state.conversations.filter(conv => 
      conv.last_message?.sender_id !== userId && !(conv as any).is_archived
    ).length;
    const outbox = state.conversations.filter(conv => 
      conv.last_message?.sender_id === userId && !(conv as any).is_archived
    ).length;

    return {
      total,
      unread,
      archived,
      inbox,
      outbox,
      totalUnreadCount: state.unreadCount
    };
  }, [state.conversations, state.unreadCount, userId]);

  const refreshConversations = fetchConversations;

  return {
    conversations: state.conversations,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markMessagesAsRead,
    markConversationAsRead,
    markMultipleConversationsAsRead,
    sendMessage,
    refreshConversations,
    // New inbox/outbox management methods
    archiveConversations,
    deleteConversations,
    searchConversations,
    fetchConversationsWithOptions,
    getConversationStats
  };
}