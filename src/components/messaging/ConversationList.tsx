'use client';

import React, { useState, useMemo } from 'react';
import { ConversationWithDetails } from '@/types/messages';
import { formatDistanceToNow } from 'date-fns';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

export type ConversationFilter = 'all' | 'inbox' | 'outbox' | 'archived';
export type ConversationSort = 'recent' | 'oldest' | 'unread' | 'name';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeConversation: ConversationWithDetails | null;
  onConversationSelect: (conversation: ConversationWithDetails) => void;
  onArchiveConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  loading: boolean;
  currentUserId: string;
}

export default function ConversationList({ 
  conversations, 
  activeConversation, 
  onConversationSelect,
  onArchiveConversation,
  onDeleteConversation,
  onMarkAsRead,
  loading,
  currentUserId
}: ConversationListProps) {
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [sort, setSort] = useState<ConversationSort>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations.filter(conv => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesParticipant = conv.other_participant?.display_name?.toLowerCase().includes(query);
        const matchesListing = `${conv.listing?.year} ${conv.listing?.make} ${conv.listing?.model}`.toLowerCase().includes(query);
        const matchesLastMessage = conv.last_message?.message_text?.toLowerCase().includes(query);
        
        if (!matchesParticipant && !matchesListing && !matchesLastMessage) {
          return false;
        }
      }

      // Type filter
      switch (filter) {
        case 'inbox':
          return conv.last_message?.sender_id !== currentUserId;
        case 'outbox':
          return conv.last_message?.sender_id === currentUserId;
        case 'archived':
          return (conv as any).is_archived === true;
        default:
          return (conv as any).is_archived !== true; // Show non-archived by default
      }
    });

    // Sort conversations
    filtered.sort((a, b) => {
            switch (sort) {
        case 'oldest':
          return new Date(a.last_message?.created_at || a.created_at).getTime() -
                 new Date(b.last_message?.created_at || b.created_at).getTime();
        case 'unread':
          if (a.unread_count !== b.unread_count) {
            return b.unread_count - a.unread_count;
          }
          // Fall through to recent for secondary sort
                case 'recent':
        default:
          return new Date(b.last_message?.created_at || b.created_at).getTime() -
                 new Date(a.last_message?.created_at || a.created_at).getTime();
        case 'name':
          return (a.other_participant?.display_name || '').localeCompare(
            b.other_participant?.display_name || ''
          );
      }
    });

    return filtered;
  }, [conversations, filter, sort, searchQuery, currentUserId]);

  const handleSelectConversation = (conversationKey: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationKey)) {
      newSelected.delete(conversationKey);
    } else {
      newSelected.add(conversationKey);
    }
    setSelectedConversations(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedConversations.size === filteredAndSortedConversations.length) {
      setSelectedConversations(new Set());
      setShowBulkActions(false);
    } else {
      const allKeys = new Set(filteredAndSortedConversations.map(getConversationKey));
      setSelectedConversations(allKeys);
      setShowBulkActions(true);
    }
  };

  const handleBulkArchive = () => {
    selectedConversations.forEach(key => {
      if (onArchiveConversation) {
        onArchiveConversation(key);
      }
    });
    setSelectedConversations(new Set());
    setShowBulkActions(false);
  };

  const handleBulkMarkAsRead = () => {
    selectedConversations.forEach(key => {
      if (onMarkAsRead) {
        onMarkAsRead(key);
      }
    });
    setSelectedConversations(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (confirm('Are you sure you want to delete the selected conversations?')) {
      selectedConversations.forEach(key => {
        if (onDeleteConversation) {
          onDeleteConversation(key);
        }
      });
      setSelectedConversations(new Set());
      setShowBulkActions(false);
    }
  };

  function getConversationKey(conversation: ConversationWithDetails): string {
    return `${conversation.listing_id}-${conversation.other_participant.id}`;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1">
      {/* Header */}
      <div className="p-6 border-b border-md-sys-outline-variant bg-md-sys-surface-container-low rounded-t-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-md-title-large text-md-sys-on-surface">Messages</h2>
            <p className="text-md-body-medium text-md-sys-on-surface-variant">
              {filteredAndSortedConversations.length} conversation{filteredAndSortedConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkMarkAsRead}
                className={cn(
                  "p-3 text-md-sys-on-surface-variant rounded-3xl transition-all duration-200",
                  "hover:text-md-sys-primary hover:bg-md-sys-primary-container/50",
                  "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                )}
                title="Mark as read"
              >
                <MaterialYouIcon name="eye" size="sm" />
              </button>
              <button
                onClick={handleBulkArchive}
                className={cn(
                  "p-3 text-md-sys-on-surface-variant rounded-3xl transition-all duration-200",
                  "hover:text-md-sys-secondary hover:bg-md-sys-secondary-container/50",
                  "focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20"
                )}
                title="Archive"
              >
                <MaterialYouIcon name="archive" size="sm" />
              </button>
              <button
                onClick={handleBulkDelete}
                className={cn(
                  "p-3 text-md-sys-on-surface-variant rounded-3xl transition-all duration-200",
                  "hover:text-md-sys-error hover:bg-md-sys-error-container/50",
                  "focus:outline-none focus:ring-2 focus:ring-md-sys-error/20"
                )}
                title="Delete"
              >
                <MaterialYouIcon name="trash" size="sm" />
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MaterialYouIcon 
            name="search" 
            size="sm" 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-md-sys-on-surface-variant" 
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-3 rounded-3xl transition-all duration-200",
              "bg-md-sys-surface-container border border-md-sys-outline-variant",
              "text-md-body-medium text-md-sys-on-surface placeholder:text-md-sys-on-surface-variant",
              "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary"
            )}
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'inbox', 'outbox', 'archived'] as ConversationFilter[]).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={cn(
                  "px-4 py-2 text-md-label-large rounded-3xl transition-all duration-200 capitalize",
                  filter === filterOption
                    ? "bg-md-sys-primary-container text-md-sys-on-primary-container"
                    : "text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container"
                )}
              >
                {filterOption}
              </button>
            ))}
          </div>

          {/* Sort and Select Controls */}
          <div className="flex items-center justify-between">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ConversationSort)}
              className={cn(
                "text-md-body-medium border border-md-sys-outline-variant rounded-3xl px-4 py-2",
                "bg-md-sys-surface-container text-md-sys-on-surface",
                "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary"
              )}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
              <option value="name">Name A-Z</option>
            </select>
            
            {filteredAndSortedConversations.length > 0 && (
              <button
                onClick={handleSelectAll}
                className={cn(
                  "flex items-center px-4 py-2 text-md-label-medium rounded-3xl transition-all duration-200",
                  "text-md-sys-on-surface-variant hover:text-md-sys-primary hover:bg-md-sys-primary-container/50",
                  "focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                )}
                title={selectedConversations.size === filteredAndSortedConversations.length ? 'Deselect all' : 'Select all'}
                            >
                <MaterialYouIcon
                  name={selectedConversations.size === filteredAndSortedConversations.length ? "checkbox" : "checkbox-outline"} 
                  size="sm" 
                  className="mr-2" 
                />
                Select All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center">
              <MaterialYouIcon name="forum" size="xl" className="mx-auto text-md-sys-on-surface-variant mb-4" />
              <h3 className="text-md-title-medium text-md-sys-on-surface mb-2">
                {searchQuery ? 'No matching conversations' : filter === 'archived' ? 'No archived conversations' : 'No conversations yet'}
              </h3>
              <p className="text-md-body-medium text-md-sys-on-surface-variant">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : filter === 'archived' 
                    ? 'Archived conversations will appear here'
                    : 'Start messaging with buyers and sellers to see your conversations here.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-md-sys-outline-variant/50">
            {filteredAndSortedConversations.map((conversation) => {
              const conversationKey = getConversationKey(conversation);
              return (
                <ConversationItem
                  key={conversationKey}
                  conversation={conversation}
                                    conversationKey={conversationKey}
                  isActive={activeConversation?.listing_id === conversation.listing_id &&
                            activeConversation?.other_participant.id === conversation.other_participant.id}
                  isSelected={selectedConversations.has(conversationKey)}
                  onSelect={() => handleSelectConversation(conversationKey)}
                  onClick={() => onConversationSelect(conversation)}
                  onArchive={onArchiveConversation ? () => onArchiveConversation(conversationKey) : undefined}
                  onDelete={onDeleteConversation ? () => onDeleteConversation(conversationKey) : undefined}
                  onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(conversationKey) : undefined}
                  currentUserId={currentUserId}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  conversationKey: string;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkAsRead?: () => void;
  currentUserId: string;
}

function ConversationItem({ 
  conversation, 
  conversationKey,
  isActive, 
  isSelected,
  onSelect,
  onClick, 
  onArchive,
  onDelete,
  onMarkAsRead,
  currentUserId
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const isFromCurrentUser = conversation.last_message?.sender_id === currentUserId;
  const isArchived = (conversation as any).is_archived === true;

  return (
    <div
      className={cn(
        "relative p-4 cursor-pointer transition-all duration-200",
        "hover:bg-md-sys-surface-container-high",
        isActive && "bg-md-sys-primary-container/30 border-r-4 border-md-sys-primary",
        isSelected && "bg-md-sys-secondary-container/30"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-3">
        {/* Selection Checkbox - Fixed width to prevent layout shift */}
        <div className="flex-shrink-0 w-6 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              "p-1 rounded-3xl transition-all duration-200",
              showActions || isSelected ? 'opacity-100' : 'opacity-0'
            )}
                    >
            <MaterialYouIcon
              name={isSelected ? "checkbox" : "checkbox-outline"} 
              size="sm" 
              className={isSelected ? "text-md-sys-primary" : "text-md-sys-on-surface-variant"} 
            />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {conversation.other_participant?.profile_image_url ? (
            <img
              className="h-12 w-12 rounded-3xl object-cover shadow-md-elevation-1"
              src={conversation.other_participant.profile_image_url}
              alt={conversation.other_participant?.display_name || 'User'}
            />
          ) : (
            <div className="h-12 w-12 rounded-3xl bg-md-sys-surface-container-high flex items-center justify-center shadow-md-elevation-1">
                              <MaterialYouIcon name="user" size="md" className="text-md-sys-on-surface-variant" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <p className="text-md-body-large font-medium text-md-sys-on-surface truncate">
                {conversation.other_participant?.display_name || 'Unknown User'}
              </p>
              {isFromCurrentUser && (
                <MaterialYouIcon name="arrow-up" size="xs" className="text-md-sys-primary" aria-label="You sent the last message" />
              )}
              {!isFromCurrentUser && conversation.unread_count > 0 && (
                <MaterialYouIcon name="arrow-down" size="xs" className="text-md-sys-secondary" aria-label="New message received" />
              )}
              {isArchived && (
                <MaterialYouIcon name="archive" size="xs" className="text-md-sys-tertiary" aria-label="Archived" />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {conversation.unread_count > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 py-1 text-md-label-small font-medium bg-md-sys-error-container text-md-sys-on-error-container rounded-3xl">
                  {conversation.unread_count}
                </span>
              )}
              
              {/* Action Menu */}
              {showActions && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle dropdown - implement dropdown menu here
                    }}
                    className={cn(
                      "p-2 rounded-3xl transition-all duration-200",
                      "text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container"
                    )}
                  >
                    <MaterialYouIcon name="ellipsis-vertical" size="sm" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Listing Info */}
          <div className="flex items-center text-md-label-medium text-md-sys-on-surface-variant mb-2">
                            <MaterialYouIcon name="car" size="xs" className="mr-2" />
            <span className="truncate">
              {conversation.listing?.year} {conversation.listing?.make} {conversation.listing?.model}
            </span>
            <span className="mx-2">•</span>
            <span className="font-medium text-md-sys-on-surface">
              {conversation.listing?.price ? formatPrice(conversation.listing.price) : 'Price N/A'}
            </span>
          </div>

          {/* Last Message */}
          <p className="text-md-body-medium text-md-sys-on-surface mb-2">
            {isFromCurrentUser && <span className="text-md-sys-on-surface-variant">You: </span>}
            {conversation.last_message?.message_text ? truncateText(conversation.last_message.message_text, 60) : 'No messages yet'}
          </p>

          {/* Timestamp */}
          <div className="flex items-center text-md-label-medium text-md-sys-on-surface-variant">
                        <MaterialYouIcon name="schedule" size="xs" className="mr-2" />
            <span>
              {conversation.last_message?.created_at ? formatDistanceToNow(new Date(conversation.last_message.created_at), {
                addSuffix: true
              }) : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="absolute right-4 top-4 flex items-center space-x-1 bg-md-sys-surface-container border border-md-sys-outline-variant rounded-3xl shadow-md-elevation-2 p-2">
          {conversation.unread_count > 0 && onMarkAsRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              className={cn(
                "p-2 rounded-3xl transition-all duration-200",
                "text-md-sys-on-surface-variant hover:text-md-sys-primary hover:bg-md-sys-primary-container/50"
              )}
              title="Mark as read"
            >
                              <MaterialYouIcon name="eye" size="xs" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className={cn(
                "p-2 rounded-3xl transition-all duration-200",
                "text-md-sys-on-surface-variant hover:text-md-sys-secondary hover:bg-md-sys-secondary-container/50"
              )}
              title="Archive"
            >
              <MaterialYouIcon name="archive" size="xs" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this conversation?')) {
                  onDelete();
                }
              }}
              className={cn(
                "p-2 rounded-3xl transition-all duration-200",
                "text-md-sys-on-surface-variant hover:text-md-sys-error hover:bg-md-sys-error-container/50"
              )}
              title="Delete"
            >
                              <MaterialYouIcon name="trash" size="xs" />
            </button>
          )}
        </div>
      )}
    </div>
  );
} 