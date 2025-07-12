'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { ConversationWithDetails, MessageWithProfiles, ThreadedMessage } from '@/types/messages';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import NewMessageModal from '@/components/messaging/NewMessageModal';
import RealtimeIndicator from '@/components/messaging/RealtimeIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import AppLayout, { useToast } from '@/components/AppLayout';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const { addToast } = useToast();
  const hasMarkedAsRead = useRef<Set<string>>(new Set());
  
  // Handle new message notifications - memoized to prevent subscription resets
  const handleNewMessage = useCallback((message: MessageWithProfiles) => {
    addToast({
      type: 'info',
      title: `New message from ${message.sender.display_name}`,
      message: `About ${message.listing?.title}`,
      duration: 5000
    });
  }, [addToast]);

  // Use the real-time messaging hook with toast notifications
  const {
    conversations,
    unreadCount,
    loading,
    error,
    markMessagesAsRead,
    markConversationAsRead,
    sendMessage,
    refreshConversations
  } = useRealtimeMessaging({
    userId: user?.id || null,
    activeConversationId: activeConversation?.listing_id || null,
    activeConversationMessages: activeConversation?.messages || [],
    showToastNotifications: true,
    onNewMessage: handleNewMessage
  });

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  };

  // Build threaded messages from flat messages array
  const buildThreadedMessages = (messages: MessageWithProfiles[]): ThreadedMessage[] => {
    const messageMap = new Map<string, ThreadedMessage>();
    const rootMessages: ThreadedMessage[] = [];

    // First pass: create all threaded messages
    messages.forEach(msg => {
      const threadedMsg: ThreadedMessage = {
        ...msg,
        replies: []
      };
      messageMap.set(msg.id, threadedMsg);
    });

    // Second pass: build hierarchy
    messages.forEach(msg => {
      const threadedMsg = messageMap.get(msg.id);
      if (!threadedMsg) return;

      if (msg.parent_message_id) {
        const parent = messageMap.get(msg.parent_message_id);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(threadedMsg);
        } else {
          rootMessages.push(threadedMsg);
        }
      } else {
        rootMessages.push(threadedMsg);
      }
    });

    return rootMessages;
  };

  // Handle conversation selection
  const handleConversationSelect = React.useCallback(async (conversation: ConversationWithDetails) => {
    try {
      const conversationKey = conversation.listing_id;
      console.log('🔄 Selecting conversation:', conversationKey, 'Current messages:', conversation.messages?.length || 0);
      
      // Set active conversation first - preserve existing messages if available
      setActiveConversation(prev => ({ 
        ...conversation, 
        messages: conversation.messages || [] 
      }));

      // Fetch messages for the conversation
      const messages = await fetchMessages(conversation.listing_id);
      console.log('📥 Fetched messages for conversation:', conversationKey, 'Count:', messages.length);
      
      const updatedConversation = { ...conversation, messages };
      setActiveConversation(updatedConversation);
      
      // Mark conversation as read only once per session to avoid loops
      const hasUnreadMessages = conversation.unread_count > 0;
      if (hasUnreadMessages && !hasMarkedAsRead.current.has(conversationKey)) {
        hasMarkedAsRead.current.add(conversationKey);
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
          markConversationAsRead(conversation.listing_id);
        }, 100);
      }
    } catch (err) {
      console.error('Error selecting conversation:', err);
    }
  }, [markConversationAsRead]);

  // Update active conversation when conversations update via real-time
  // This ensures new messages appear immediately when received
  useEffect(() => {
    if (!activeConversation || conversations.length === 0) {
      return;
    }

    const updatedConversation = conversations.find(
      conv => conv.listing_id === activeConversation.listing_id &&
              conv.other_participant?.id === activeConversation.other_participant?.id
    );
    
    if (updatedConversation) {
      // Check if there are new messages or message status changes
      const currentMessageCount = activeConversation.messages?.length || 0;
      const newMessageCount = updatedConversation.messages?.length || 0;
      
      // Update if we have new messages OR if message content has changed
      const hasNewMessages = newMessageCount > currentMessageCount;
      const lastMessageChanged = updatedConversation.last_message_created_at !== 
        activeConversation.last_message_created_at;
      
      // Only update if we have new messages AND the updated conversation has more messages
      // OR if the last message changed but we preserve the longer message history
      if (hasNewMessages || lastMessageChanged) {
        // Always preserve the longer message history
        const messagesToUse = (currentMessageCount > newMessageCount) 
          ? activeConversation.messages 
          : updatedConversation.messages;
          
        const finalConversation = {
          ...updatedConversation,
          messages: messagesToUse
        };
        
        console.log('🔄 Updating active conversation with real-time changes:', {
          hasNewMessages,
          lastMessageChanged,
          currentCount: currentMessageCount,
          newCount: newMessageCount,
          activeConversationId: activeConversation.listing_id,
          updatedConversationMessages: updatedConversation.messages?.length || 0,
          finalMessageCount: messagesToUse?.length || 0
        });
        setActiveConversation(finalConversation);
      } else {
        console.log('ℹ️ No significant changes, keeping current active conversation');
      }
    }
  }, [conversations, activeConversation?.listing_id, activeConversation?.other_participant?.id]);

  // Clear marked as read when conversations change (new session or refresh)
  useEffect(() => {
    hasMarkedAsRead.current.clear();
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <MaterialYouIcon name="message" size="xl" className="mx-auto mb-4 text-md-sys-on-surface-variant" />
            <h2 className="text-md-title-large text-md-sys-on-surface mb-2">Sign in to view messages</h2>
            <p className="text-md-body-medium text-md-sys-on-surface-variant">You need to be logged in to access your messages.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MaterialYouIcon name="inbox" size="lg" className="text-md-sys-primary mr-3" />
              <div>
                <h1 className="text-md-display-small text-md-sys-on-surface">Messages</h1>
                <div className="flex items-center space-x-4">
                  <p className="text-md-body-medium text-md-sys-on-surface-variant">
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-3xl text-md-label-small bg-md-sys-error-container text-md-sys-on-error-container mr-2">
                        {unreadCount} unread
                      </span>
                    )}
                    <RealtimeIndicator />
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNewMessageModal(true)}
                className={cn(
                  "inline-flex items-center px-6 py-3 text-md-label-large font-medium rounded-3xl shadow-md-elevation-1",
                  "bg-md-sys-primary text-md-sys-on-primary",
                  "hover:bg-md-sys-primary-container hover:text-md-sys-on-primary-container",
                  "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus:ring-offset-2",
                  "transition-all duration-200"
                )}
              >
                <MaterialYouIcon name="plus" size="sm" className="mr-2" />
                New Message
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="rounded-3xl bg-md-sys-error-container p-4 mb-6 border border-md-sys-error/20">
            <div className="text-md-body-medium text-md-sys-on-error-container">
              Error loading messages: {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="h-[calc(100vh-6rem)] overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onConversationSelect={handleConversationSelect}
                  loading={loading}
                  currentUserId={user.id}
                />
              </div>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
                {activeConversation ? (
                  <>
                    {/* Show loading state if data is incomplete */}
                    {!activeConversation.messages || !activeConversation.other_participant || !activeConversation.listing ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <LoadingSpinner />
                          <h3 className="text-md-title-medium text-md-sys-on-surface mt-4 mb-2">
                            Loading conversation...
                          </h3>
                          <p className="text-md-body-medium text-md-sys-on-surface-variant">
                            Please wait while we load the messages
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Listing Info Header */}
                        <div className="bg-md-sys-surface-container-low border border-md-sys-outline-variant rounded-3xl p-4 mb-4 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <MaterialYouIcon name="car" size="md" className="text-md-sys-primary" />
                              <div>
                                <h3 className="text-md-title-small text-md-sys-on-surface font-medium">
                                  {`${activeConversation.listing.year || ''} ${activeConversation.listing.make || ''} ${activeConversation.listing.model || ''}`.trim()}
                                </h3>
                                <p className="text-md-body-small text-md-sys-on-surface-variant">
                                  ${activeConversation.listing.price?.toLocaleString() || 'Price not listed'}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => window.open(`/listings/${activeConversation.listing.id}`, '_blank')}
                              className={cn(
                                "inline-flex items-center px-4 py-2 text-md-label-medium font-medium rounded-2xl",
                                "bg-md-sys-primary-container text-md-sys-on-primary-container",
                                "hover:bg-md-sys-primary hover:text-md-sys-on-primary",
                                "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20",
                                "transition-all duration-200"
                              )}
                            >
                              <MaterialYouIcon name="share" size="sm" className="mr-2" />
                              View Details
                            </button>
                          </div>
                        </div>

                        {/* Message Thread - Fixed Height with Scroll */}
                        <div className="flex-1 min-h-0">
                          <MessageThread
                            conversationId={activeConversation.listing_id}
                            messages={activeConversation.messages || []}
                            threadedMessages={buildThreadedMessages(activeConversation.messages || [])}
                            currentUserId={user.id}
                            otherParticipant={{
                              id: activeConversation.other_participant.id || 'unknown',
                              display_name: activeConversation.other_participant.display_name || 'Unknown User',
                              profile_image_url: activeConversation.other_participant.profile_image_url,
                              email: activeConversation.other_participant.email || 'unknown@example.com'
                            }}
                            listing={{
                              id: activeConversation.listing.id || 'unknown',
                              title: `${activeConversation.listing.year || ''} ${activeConversation.listing.make || ''} ${activeConversation.listing.model || ''}`.trim(),
                              make: activeConversation.listing.make || 'Unknown',
                              model: activeConversation.listing.model || 'Unknown',
                              year: activeConversation.listing.year || 0,
                              price: activeConversation.listing.price || 0,
                              status: activeConversation.listing.status || 'active'
                            }}
                            onSendMessage={sendMessage}
                            onMarkAsRead={markConversationAsRead}
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MaterialYouIcon name="paper-airplane" size="xl" className="mx-auto mb-4 text-md-sys-on-surface-variant" />
                      <h3 className="text-md-title-medium text-md-sys-on-surface mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-md-body-medium text-md-sys-on-surface-variant">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Message Modal */}
        {showNewMessageModal && (
          <NewMessageModal
            onClose={() => setShowNewMessageModal(false)}
            onSendMessage={sendMessage}
          />
        )}
      </div>
    </AppLayout>
  );
} 