'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { MessageWithProfiles, ThreadedMessage, SendMessageRequest, ReplyToMessageRequest } from '@/types/messages';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import MaterialYouIcon from '@/components/ui/MaterialYouIcon';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReportMessageModal from './ReportMessageModal';
import { cn } from '@/lib/utils';

interface MessageSearchFilters {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  sender?: string;
  messageType?: 'all' | 'text' | 'inquiry' | 'offer';
}

interface SearchResult {
  messageId: string;
  snippet: string;
  relevanceScore: number;
  matchIndices: [number, number][];
}

interface MessageThreadProps {
  conversationId: string;
  messages: MessageWithProfiles[];
  threadedMessages: ThreadedMessage[];
  currentUserId: string;
  otherParticipant: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
  };
  onSendMessage: (messageData: SendMessageRequest) => Promise<void>;
  onMarkAsRead: (conversationId: string) => Promise<void>;
  showThreaded?: boolean;
  onToggleView?: () => void;
  loading?: boolean;
}

export default function MessageThread({
  conversationId,
  messages,
  threadedMessages,
  currentUserId,
  otherParticipant,
  listing,
  onSendMessage,
  onMarkAsRead,
  showThreaded = false,
  onToggleView,
  loading = false
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageWithProfiles | null>(null);
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<MessageSearchFilters>({
    query: '',
    messageType: 'all'
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<MessageWithProfiles | null>(null);
  
  // Accessibility state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [messageStatusMessage, setMessageStatusMessage] = useState<string>('');
  
  // Refs and IDs for accessibility
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  
  const threadHeaderId = useId();
  const statusRegionId = useId();
  const messageStatusId = useId();
  const searchRegionId = useId();
  const messagesRegionId = useId();
  const composerRegionId = useId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId && currentUserId) {
      onMarkAsRead(conversationId);
    }
  }, [conversationId, currentUserId, onMarkAsRead]);

  // Announce new messages for screen readers
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender_id !== currentUserId) {
        setMessageStatusMessage(`New message from ${latestMessage.sender?.display_name || 'other user'}: ${latestMessage.message_text.substring(0, 100)}${latestMessage.message_text.length > 100 ? '...' : ''}`);
      }
    }
  }, [messages, currentUserId]);

  // Search functionality
  const highlightSearchTerm = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-md-sys-tertiary-container text-md-sys-on-tertiary-container rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const performSearch = useCallback(async () => {
    if (!searchFilters.query.trim()) {
      setSearchResults([]);
      setStatusMessage('');
      return;
    }

    setSearching(true);
    setStatusMessage('Searching messages...');
    
    try {
      // Client-side search through messages
      const query = searchFilters.query.toLowerCase();
      const results: SearchResult[] = [];
      const safeMessages = messages || [];

      safeMessages.forEach(message => {
        // Apply filters
        if (searchFilters.sender && message.sender_id !== searchFilters.sender) return;
        if (searchFilters.messageType !== 'all' && message.message_type !== searchFilters.messageType) return;
        if (searchFilters.dateFrom && new Date(message.created_at) < new Date(searchFilters.dateFrom)) return;
        if (searchFilters.dateTo && new Date(message.created_at) > new Date(searchFilters.dateTo)) return;

        const messageText = message.message_text.toLowerCase();
        const queryIndex = messageText.indexOf(query);
        
        if (queryIndex !== -1) {
          // Calculate relevance score based on multiple factors
          let relevanceScore = 1;
          
          // Boost score for exact matches
          if (messageText === query) relevanceScore += 3;
          
          // Boost score for messages from the other participant
          if (message.sender_id !== currentUserId) relevanceScore += 1;
          
          // Boost score for recent messages
          const daysSinceMessage = (Date.now() - new Date(message.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceMessage < 7) relevanceScore += 2;
          else if (daysSinceMessage < 30) relevanceScore += 1;

          // Create snippet with context
          const snippetStart = Math.max(0, queryIndex - 30);
          const snippetEnd = Math.min(messageText.length, queryIndex + query.length + 30);
          const snippet = (snippetStart > 0 ? '...' : '') + 
                         message.message_text.substring(snippetStart, snippetEnd) +
                         (snippetEnd < messageText.length ? '...' : '');

          results.push({
            messageId: message.id,
            snippet,
            relevanceScore,
            matchIndices: [[queryIndex, queryIndex + query.length]]
          });
        }
      });

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      setStatusMessage(`Found ${results.length} message${results.length === 1 ? '' : 's'} matching "${searchFilters.query}"`);
    } catch (error) {
      console.error('Error performing search:', error);
      setStatusMessage('Error occurred while searching messages');
    } finally {
      setSearching(false);
    }
  }, [searchFilters, messages, currentUserId]);

  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const scrollToSearchResult = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    
    const result = searchResults[index];
    const messageElement = document.getElementById(`message-${result.messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2');
      setStatusMessage(`Showing result ${index + 1} of ${searchResults.length}: ${result.snippet}`);
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2');
      }, 3000);
    }
  };

  const navigateSearchResults = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? Math.min(currentSearchIndex + 1, searchResults.length - 1)
      : Math.max(currentSearchIndex - 1, 0);
    
    setCurrentSearchIndex(newIndex);
    scrollToSearchResult(newIndex);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setStatusMessage('Sending message...');
    
    try {
      if (!otherParticipant?.id) {
        console.error('Cannot send message: recipient not found');
        setStatusMessage('Error: Cannot send message - recipient not found');
        return;
      }

      const messageData: SendMessageRequest = {
        listing_id: conversationId,
        recipient_id: otherParticipant.id,
        message_text: newMessage.trim(),
        message_type: 'text'
      };

      if (replyingTo) {
        messageData.parent_message_id = replyingTo.id;
        messageData.thread_id = replyingTo.thread_id || replyingTo.id;
        setStatusMessage(`Sending reply to ${replyingTo.sender?.display_name || 'message'}...`);
      }

      await onSendMessage(messageData);
      setNewMessage('');
      setReplyingTo(null);
      setStatusMessage(replyingTo ? 'Reply sent successfully' : 'Message sent successfully');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape' && replyingTo) {
      setReplyingTo(null);
      setStatusMessage('Reply cancelled');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const formatDateHeader = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };

  const groupMessagesByDate = (messages: MessageWithProfiles[]) => {
    const groups: { [key: string]: MessageWithProfiles[] } = {};
    
    // Safety check to ensure messages is an array
    if (!messages || !Array.isArray(messages)) {
      return groups;
    }
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const renderSearchBar = () => (
    <section 
      id={searchRegionId}
      className={cn(
        "border-b border-md-sys-outline-variant bg-md-sys-surface-container-low transition-all duration-300",
        showSearch ? 'p-4' : 'p-0 max-h-0 overflow-hidden'
      )}
      aria-labelledby="search-heading"
      aria-expanded={showSearch}
    >
      {showSearch && (
        <>
          <h3 id="search-heading" className="sr-only">Search Messages</h3>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <label htmlFor="message-search" className="sr-only">
              Search messages by text content
            </label>
            <MaterialYouIcon 
              name="Search" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-md-sys-on-surface-variant" 
              aria-hidden="true"
            />
            <input
              id="message-search"
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchFilters.query}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
              aria-describedby="search-help"
              className="w-full pl-10 pr-10 py-2 border border-md-sys-outline rounded-3xl focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary bg-md-sys-surface-container text-md-sys-on-surface text-md-body-medium focus-visible:outline-none"
            />
            <div id="search-help" className="sr-only">
              Type to search through all messages in this conversation. Results will appear below as you type.
            </div>
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2" role="status" aria-label="Searching messages">
                <LoadingSpinner />
                <span className="sr-only">Searching...</span>
              </div>
            )}
          </div>

          {/* Search Filters */}
          <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <legend className="sr-only">Filter search results</legend>
            
            <div>
              <label htmlFor="search-date-from" className="block text-md-label-medium font-medium text-md-sys-on-surface mb-1">
                From Date
              </label>
              <input
                id="search-date-from"
                type="date"
                value={searchFilters.dateFrom || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                aria-describedby="date-from-help"
                className="w-full px-3 py-2 border border-md-sys-outline rounded-3xl focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary bg-md-sys-surface-container text-md-sys-on-surface text-md-body-medium focus-visible:outline-none"
              />
              <div id="date-from-help" className="sr-only">Search messages from this date onwards</div>
            </div>
            
            <div>
              <label htmlFor="search-date-to" className="block text-md-label-medium font-medium text-md-sys-on-surface mb-1">
                To Date
              </label>
              <input
                id="search-date-to"
                type="date"
                value={searchFilters.dateTo || ''}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                aria-describedby="date-to-help"
                className="w-full px-3 py-2 border border-md-sys-outline rounded-3xl focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary bg-md-sys-surface-container text-md-sys-on-surface text-md-body-medium focus-visible:outline-none"
              />
              <div id="date-to-help" className="sr-only">Search messages up to this date</div>
            </div>
            
            <div>
              <label htmlFor="search-message-type" className="block text-md-label-medium font-medium text-md-sys-on-surface mb-1">
                Message Type
              </label>
              <select
                id="search-message-type"
                value={searchFilters.messageType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, messageType: e.target.value as any }))}
                aria-describedby="message-type-help"
                className="w-full px-3 py-2 border border-md-sys-outline rounded-3xl focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary bg-md-sys-surface-container text-md-sys-on-surface text-md-body-medium focus-visible:outline-none"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="inquiry">Inquiry</option>
                <option value="offer">Offer</option>
              </select>
              <div id="message-type-help" className="sr-only">Filter results by message type</div>
            </div>
          </fieldset>

          {/* Search Results Summary */}
          {searchResults.length > 0 && (
            <div 
              className="flex items-center justify-between bg-md-sys-surface-container rounded-3xl p-3 border border-md-sys-outline-variant shadow-md-elevation-1"
              role="region"
              aria-labelledby="search-results-summary"
            >
              <span id="search-results-summary" className="text-md-body-medium text-md-sys-on-surface">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                {searchResults.length > 0 && ` • ${currentSearchIndex + 1} of ${searchResults.length}`}
              </span>
              <div className="flex items-center space-x-2" role="group" aria-label="Navigate search results">
                <button
                  onClick={() => navigateSearchResults('prev')}
                  disabled={currentSearchIndex === 0}
                  aria-label={`Go to previous search result (${currentSearchIndex} of ${searchResults.length})`}
                  className="p-1 rounded-full text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high disabled:text-md-sys-on-surface-variant/50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                >
                  <MaterialYouIcon name="chevron-up" className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => navigateSearchResults('next')}
                  disabled={currentSearchIndex === searchResults.length - 1}
                  aria-label={`Go to next search result (${currentSearchIndex + 2} of ${searchResults.length})`}
                  className="p-1 rounded-full text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high disabled:text-md-sys-on-surface-variant/50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                >
                  <MaterialYouIcon name="chevron-down" className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {searchFilters.query.trim() && searchResults.length === 0 && !searching && (
            <div className="text-center py-4 text-md-sys-on-surface-variant" role="status">
              <MaterialYouIcon name="chat-bubble-outline" className="h-8 w-8 mx-auto mb-2 text-md-sys-on-surface-variant" aria-hidden="true" />
              <p className="text-md-body-medium">No messages found matching your search</p>
            </div>
          )}
        </>
      )}
    </section>
  );

  // Component for individual message to manage its own state
  const MessageItem = ({ message, isInThread = false, depth = 0 }: { 
    message: MessageWithProfiles; 
    isInThread?: boolean; 
    depth?: number; 
  }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const isCurrentUser = message.sender_id === currentUserId;
    const maxDepth = 3;
    const actualDepth = Math.min(depth, maxDepth);
    const messageId = useId();
    const dropdownId = useId();
    
    return (
      <article
        key={message.id}
        id={`message-${message.id}`}
        className={cn(
          "transition-all duration-200",
          isInThread && `ml-${actualDepth * 4} border-l-2 border-md-sys-outline-variant pl-4`
        )}
        aria-labelledby={messageId}
      >
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-xs md:max-w-md lg:max-w-lg ${
            isCurrentUser ? 'order-2' : 'order-1'
          }`}>
            {/* Message Header */}
            <header className={`flex items-center mb-1 ${
              isCurrentUser ? 'justify-end' : 'justify-start'
            }`}>
              {!isCurrentUser && (
                <div className="flex items-center mr-2">
                  {message.sender.profile_image_url ? (
                    <img
                      className="h-6 w-6 rounded-full object-cover"
                      src={message.sender.profile_image_url}
                      alt={`${message.sender.display_name}'s profile picture`}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-md-sys-surface-container-high flex items-center justify-center">
                      <MaterialYouIcon name="user" className="h-3 w-3 text-md-sys-on-surface-variant" aria-hidden="true" />
                    </div>
                  )}
                  <span className="ml-2 text-md-label-medium font-medium text-md-sys-on-surface">
                    {message.sender.display_name}
                  </span>
                </div>
              )}
              <time 
                className="text-md-label-small text-md-sys-on-surface-variant"
                dateTime={message.created_at}
                title={format(new Date(message.created_at), 'PPPp')}
              >
                {formatMessageTime(message.created_at)}
              </time>
              
              {/* Message Actions Dropdown */}
              {!isCurrentUser && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-expanded={showDropdown}
                    aria-haspopup="menu"
                    aria-controls={showDropdown ? dropdownId : undefined}
                    aria-label={`Message actions for ${message.sender.display_name}'s message`}
                    className="p-1 text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high transition-colors rounded-full opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                  >
                    <MaterialYouIcon name="ellipsis-vertical" className="h-3 w-3" aria-hidden="true" />
                  </button>
                  
                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                        aria-hidden="true"
                      />
                      
                      {/* Dropdown Menu */}
                      <div 
                        id={dropdownId}
                        className="absolute right-0 top-full mt-1 w-32 bg-md-sys-surface-container border border-md-sys-outline-variant rounded-3xl shadow-md-elevation-2 z-20"
                        role="menu"
                        aria-labelledby={messageId}
                      >
                        <button
                          onClick={() => {
                            setReplyingTo(message);
                            setShowDropdown(false);
                            setStatusMessage(`Replying to message from ${message.sender?.display_name || 'user'}`);
                          }}
                          role="menuitem"
                          className="flex items-center w-full px-3 py-2 text-md-body-medium text-md-sys-on-surface hover:bg-md-sys-surface-container-high rounded-t-3xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                        >
                          <MaterialYouIcon name="reply" className="h-3 w-3 mr-2" aria-hidden="true" />
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            setReportingMessage(message);
                            setShowDropdown(false);
                            setStatusMessage('Opening report dialog');
                          }}
                          role="menuitem"
                          className="flex items-center w-full px-3 py-2 text-md-body-medium text-md-sys-error hover:bg-md-sys-error-container/20 rounded-b-3xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-error/20"
                        >
                          <MaterialYouIcon name="flag" className="h-3 w-3 mr-2" aria-hidden="true" />
                          Report
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </header>

            {/* Message Body */}
            <div className={cn(
              "group rounded-3xl px-4 py-2 shadow-md-elevation-1",
              isCurrentUser
                ? 'bg-md-sys-primary-container text-md-sys-on-primary-container'
                : 'bg-md-sys-surface-container-high text-md-sys-on-surface'
            )}>
              <div 
                id={messageId}
                className="text-md-body-medium whitespace-pre-wrap"
                role="text"
                aria-label={`Message from ${message.sender?.display_name || 'user'}: ${message.message_text}`}
              >
                {highlightSearchTerm(message.message_text, searchFilters.query)}
              </div>
              
              {/* Message Type Badge */}
              {message.message_type && message.message_type !== 'text' && (
                <span 
                  className={cn(
                    "inline-block mt-2 px-2 py-1 text-md-label-small rounded-full",
                    message.message_type === 'inquiry' 
                      ? 'bg-md-sys-secondary-container text-md-sys-on-secondary-container'
                      : message.message_type === 'offer'
                      ? 'bg-md-sys-tertiary-container text-md-sys-on-tertiary-container'
                      : 'bg-md-sys-surface-variant text-md-sys-on-surface-variant'
                  )}
                  aria-label={`Message type: ${message.message_type}`}
                >
                  {message.message_type}
                </span>
              )}

              {/* Moderation Status */}
              {message.is_flagged && message.moderation_status === 'pending' && (
                <div 
                  className="mt-2 text-md-label-small text-md-sys-on-error-container bg-md-sys-error-container px-2 py-1 rounded-full"
                  role="status"
                  aria-label="This message is under review by moderators"
                >
                  <MaterialYouIcon name="flag" className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  Under review
                </div>
              )}
            </div>

            {/* Message Status */}
            <footer className={`flex items-center mt-1 text-md-label-small text-md-sys-on-surface-variant ${
              isCurrentUser ? 'justify-end' : 'justify-start'
            }`}>
              {isCurrentUser && (
                <>
                  {message.is_read ? (
                    <div className="flex items-center" role="status" aria-label={`Message read ${message.read_at ? formatDistanceToNow(new Date(message.read_at), { addSuffix: true }) : ''}`}>
                      <MaterialYouIcon name="eye" className="h-3 w-3 mr-1" aria-hidden="true" />
                      <span>Read {message.read_at ? formatDistanceToNow(new Date(message.read_at), { addSuffix: true }) : ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-center" role="status" aria-label="Message sent but not yet read">
                      <MaterialYouIcon name="paper-airplane" className="h-3 w-3 mr-1" aria-hidden="true" />
                      <span>Sent</span>
                    </div>
                  )}
                </>
              )}
              
              {/* Quick Reply Button (Alternative to dropdown) */}
              {!isCurrentUser && !replyingTo && !showDropdown && (
                <button
                  onClick={() => {
                    setReplyingTo(message);
                    setStatusMessage(`Replying to message from ${message.sender?.display_name || 'user'}`);
                  }}
                  className="ml-2 p-1 text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high transition-colors rounded-full opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                  aria-label={`Reply to message from ${message.sender?.display_name || 'user'}`}
                >
                  <MaterialYouIcon name="reply" className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </footer>
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-md-sys-surface" role="status" aria-live="polite">
        <LoadingSpinner />
        <span className="sr-only">Loading conversation...</span>
      </div>
    );
  }

  // Safety check for messages
  const safeMessages = messages || [];
  const messageGroups = groupMessagesByDate(safeMessages);
  const sortedDates = Object.keys(messageGroups).sort();

  return (
    <main className="h-full flex flex-col bg-md-sys-surface" role="main" aria-labelledby={threadHeaderId}>
      {/* Status regions for screen reader announcements */}
      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      <div
        id={messageStatusId}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {messageStatusMessage}
      </div>

      {/* Thread Header */}
      <header 
        className="p-4 border-b border-md-sys-outline-variant bg-md-sys-surface-container-low shadow-md-elevation-1"
        role="banner"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Participant Avatar */}
            {otherParticipant?.profile_image_url ? (
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={otherParticipant.profile_image_url}
                alt={`${otherParticipant.display_name}'s profile picture`}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-md-sys-surface-container-high flex items-center justify-center">
                <MaterialYouIcon name="user" className="h-5 w-5 text-md-sys-on-surface-variant" aria-hidden="true" />
              </div>
            )}
            
            <div>
              <h1 id={threadHeaderId} className="text-md-title-large font-semibold text-md-sys-on-surface">
                Conversation with {otherParticipant?.display_name || 'Unknown User'}
              </h1>
              <div className="flex items-center text-md-body-medium text-md-sys-on-surface-variant">
                <MaterialYouIcon name="car" className="h-4 w-4 mr-1" aria-hidden="true" />
                <span>{listing?.year} {listing?.make} {listing?.model}</span>
                <span className="mx-2" aria-hidden="true">•</span>
                <span className="font-medium">
                  {listing?.price ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(listing.price) : 'Price not available'}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-2" role="navigation" aria-label="Conversation tools">
            {/* Search Toggle */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setStatusMessage(showSearch ? 'Search closed' : 'Search opened');
                if (!showSearch) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
              className={cn(
                "p-2 rounded-3xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20",
                showSearch 
                  ? 'bg-md-sys-primary-container text-md-sys-on-primary-container' 
                  : 'text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high'
              )}
              aria-label={showSearch ? 'Close message search' : 'Open message search'}
              aria-pressed={showSearch}
            >
              <MaterialYouIcon name="search" className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* View Toggle */}
            {onToggleView && (
              <button
                onClick={() => {
                  onToggleView();
                  setStatusMessage(`Switched to ${showThreaded ? 'linear' : 'threaded'} view`);
                }}
                className="px-3 py-1 text-md-body-medium border border-md-sys-outline rounded-3xl hover:bg-md-sys-surface-container-high transition-colors text-md-sys-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
                aria-label={`Switch to ${showThreaded ? 'linear' : 'threaded'} view mode`}
              >
                {showThreaded ? 'Linear View' : 'Threaded View'}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Messages Area */}
      <section 
        id={messagesRegionId}
        ref={messagesListRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
        role="log"
        aria-labelledby="messages-heading"
        aria-live="polite"
        aria-relevant="additions"
      >
        <h2 id="messages-heading" className="sr-only">
          Messages in conversation with {otherParticipant?.display_name || 'other user'}
        </h2>
        
        {safeMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center" role="status">
            <div className="text-center">
              <MaterialYouIcon name="chat-bubble-outline" className="mx-auto h-12 w-12 text-md-sys-on-surface-variant mb-4" aria-hidden="true" />
              <h3 className="text-md-title-large font-medium text-md-sys-on-surface mb-2">Start the conversation</h3>
              <p className="text-md-body-medium text-md-sys-on-surface-variant">
                Send a message to {otherParticipant?.display_name || 'this user'} about this {listing?.year} {listing?.make} {listing?.model}
              </p>
            </div>
          </div>
        ) : showThreaded ? (
          // Threaded view
          <div className="space-y-6" role="list" aria-label="Threaded conversation messages">
            {(threadedMessages || []).map((message) => (
              <div key={message.id} role="listitem">
                <MessageItem message={message} />
                {message.replies && message.replies.length > 0 && (
                  <div className="mt-4 space-y-4" role="list" aria-label={`Replies to message from ${message.sender?.display_name || 'user'}`}>
                    {message.replies.map((reply) => (
                      <div key={reply.id} role="listitem">
                        <MessageItem 
                          message={reply} 
                          isInThread={true} 
                          depth={(reply.depth_level || 0) + 1} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Linear view with date grouping
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <section key={date} role="group" aria-labelledby={`date-${date}`}>
                {/* Date Header */}
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-md-sys-outline-variant" aria-hidden="true"></div>
                  <div className="px-4 py-2 bg-md-sys-surface-container rounded-full shadow-md-elevation-1">
                    <h3 
                      id={`date-${date}`}
                      className="text-md-label-medium font-medium text-md-sys-on-surface"
                    >
                      {formatDateHeader(messageGroups[date][0].created_at)}
                    </h3>
                  </div>
                  <div className="flex-1 border-t border-md-sys-outline-variant" aria-hidden="true"></div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-4" role="list" aria-labelledby={`date-${date}`}>
                  {messageGroups[date].map((message) => (
                    <div key={message.id} role="listitem">
                      <MessageItem message={message} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </section>

      {/* Reply Context */}
      {replyingTo && (
        <aside 
          className="px-4 py-2 bg-md-sys-secondary-container border-b border-md-sys-outline-variant"
          role="status"
          aria-labelledby="reply-context"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center text-md-body-medium text-md-sys-on-secondary-container">
              <MaterialYouIcon name="reply" className="h-4 w-4 mr-2" aria-hidden="true" />
              <span id="reply-context">
                Replying to {replyingTo?.sender?.display_name || 'user'}:
              </span>
              <span className="ml-2 italic truncate max-w-xs">
                "{replyingTo?.message_text || ''}"
              </span>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                setStatusMessage('Reply cancelled');
              }}
              className="text-md-sys-on-secondary-container hover:text-md-sys-on-secondary-container/80 hover:bg-md-sys-secondary-container/50 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-secondary/20"
              aria-label="Cancel reply"
            >
              <MaterialYouIcon name="close" className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      {/* Message Input */}
      <section 
        id={composerRegionId}
        className="p-4 border-t border-md-sys-outline-variant bg-md-sys-surface-container-low shadow-md-elevation-1"
        role="region"
        aria-labelledby="composer-heading"
      >
        <h2 id="composer-heading" className="sr-only">
          Compose new message
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-3">
          <label htmlFor="message-input" className="sr-only">
            {replyingTo ? `Reply to ${replyingTo.sender?.display_name || 'user'}` : `Send message to ${otherParticipant?.display_name || 'user'}`}
          </label>
          <textarea
            id="message-input"
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={replyingTo ? "Type your reply..." : `Message ${otherParticipant?.display_name || 'user'}...`}
            rows={1}
            aria-describedby="message-input-help"
            className="flex-1 min-h-[2.5rem] max-h-32 px-4 py-2 border border-md-sys-outline rounded-3xl focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary resize-none bg-md-sys-surface-container text-md-sys-on-surface text-md-body-medium focus-visible:outline-none placeholder-md-sys-on-surface-variant"
            style={{ 
              height: 'auto',
              minHeight: '2.5rem'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <div id="message-input-help" className="sr-only">
            Type your message. Press Enter to send, Shift+Enter for new line, Escape to cancel reply.
          </div>
          
          <button
            type="submit"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            aria-label={sending ? 'Sending message...' : (replyingTo ? 'Send reply' : 'Send message')}
            className="px-4 py-2 bg-md-sys-primary text-md-sys-on-primary rounded-3xl hover:bg-md-sys-primary/90 hover:shadow-md-elevation-2 disabled:bg-md-sys-on-surface/12 disabled:text-md-sys-on-surface/38 disabled:cursor-not-allowed transition-all flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20"
          >
            {sending ? (
              <>
                <LoadingSpinner />
                <span className="sr-only">Sending...</span>
              </>
            ) : (
              <MaterialYouIcon name="paper-airplane" className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </form>
      </section>

      {/* Report Message Modal */}
      {reportingMessage && (
        <ReportMessageModal
          message={reportingMessage}
          isOpen={!!reportingMessage}
          onClose={() => {
            setReportingMessage(null);
            setStatusMessage('Report dialog closed');
          }}
          onReportSubmitted={() => {
            // Optionally refresh messages or show success notification
            setStatusMessage('Report submitted successfully');
            console.log('Report submitted successfully');
          }}
        />
      )}
    </main>
  );
} 