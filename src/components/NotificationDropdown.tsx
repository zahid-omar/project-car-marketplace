'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { 
  Bell, 
  X, 
  Check, 
  MessageSquare, 
  Reply, 
  AtSign, 
  Settings,
  ExternalLink,
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

interface OfferNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  time_ago: string;
  action_url: string;
  icon: string;
  offer: {
    id: string;
    offer_amount: number;
    status: string;
    listing: {
      id: string;
      title: string;
      make: string;
      model: string;
      year: number;
      price: number;
      listing_images: Array<{ image_url: string; is_primary: boolean }>;
    };
    buyer: {
      id: string;
      display_name: string;
      profile_image_url?: string;
    };
    seller: {
      id: string;
      display_name: string;
      profile_image_url?: string;
    };
  };
}

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<OfferNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Accessibility refs and IDs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstNotificationRef = useRef<HTMLButtonElement>(null);
  
  const menuId = useId();
  const statusId = useId();
  const headingId = useId();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage('Loading notifications...');

      const response = await fetch('/api/notifications?limit=20');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      
      const notificationCount = data.notifications?.length || 0;
      const unreadNotificationCount = data.unread_count || 0;
      setStatusMessage(`Loaded ${notificationCount} notifications. ${unreadNotificationCount} unread.`);
      
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setStatusMessage('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          is_read: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notificationIds.includes(notification.id) 
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      setStatusMessage(`Marked ${notificationIds.length} notification${notificationIds.length === 1 ? '' : 's'} as read`);
      
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
      setStatusMessage('Error marking notifications as read');
      throw err;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mark_all_read: true,
          is_read: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
        read_at: new Date().toISOString()
      })));
      
      setUnreadCount(0);
      setStatusMessage('All notifications marked as read');
      
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setStatusMessage('Error marking all notifications as read');
      throw err;
    }
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      // Focus first notification when opening
      setTimeout(() => {
        firstNotificationRef.current?.focus();
      }, 100);
    } else {
      setIsOpen(false);
      // Return focus to button when closing
      buttonRef.current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        setStatusMessage('Notifications closed');
        break;
      case 'Tab':
        // Allow normal tab behavior within dropdown
        break;
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead([notificationId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: OfferNotification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsOpen(false);
    setStatusMessage(`Opened notification: ${notification.title}`);
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const recentNotifications = notifications.slice(0, 5);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Status region for screen reader announcements */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex items-center justify-center w-10 h-10 rounded-full',
          'text-md-sys-on-surface-variant hover:text-md-sys-on-surface',
          'hover:bg-md-sys-on-surface/8 focus:bg-md-sys-on-surface/12 active:bg-md-sys-on-surface/12',
          'transition-all duration-md-short2 ease-md-standard',
          'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        aria-describedby={statusId}
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span 
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5',
              'bg-md-sys-error text-md-sys-on-error text-md-label-small font-medium',
              'rounded-full flex items-center justify-center',
              'ring-2 ring-md-sys-surface'
            )}
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          id={menuId}
          className={cn(
            'absolute right-0 mt-2 w-80 z-50',
            'bg-md-sys-surface-container-high rounded-xl border border-md-sys-outline-variant shadow-md-elevation-3'
          )}
          role="menu"
          aria-labelledby={headingId}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <header className="px-4 py-3 border-b border-md-sys-outline-variant">
            <div className="flex items-center justify-between">
              <h2 id={headingId} className="text-md-title-large text-md-sys-on-surface">Notifications</h2>
              <div className="flex items-center space-x-2" role="group" aria-label="Notification actions">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={cn(
                      'text-md-label-medium text-md-sys-primary',
                      'hover:text-md-sys-primary/80 hover:bg-md-sys-primary/8',
                      'focus:bg-md-sys-primary/12 px-2 py-1 rounded-lg',
                      'flex items-center transition-all duration-md-short2 ease-md-standard',
                      'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
                    )}
                    aria-label={`Mark all ${unreadCount} notifications as read`}
                    role="menuitem"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" aria-hidden="true" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setStatusMessage('Notifications closed');
                  }}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-full',
                    'text-md-sys-on-surface-variant hover:text-md-sys-on-surface',
                    'hover:bg-md-sys-on-surface/8 focus:bg-md-sys-on-surface/12',
                    'transition-all duration-md-short2 ease-md-standard',
                    'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
                  )}
                  aria-label="Close notifications"
                  role="menuitem"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-md-body-medium text-md-sys-on-surface-variant mt-1" aria-live="polite">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </header>

          {/* Content */}
          <main className="max-h-96 overflow-y-auto" role="region" aria-label="Notification list">
            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <LoadingSpinner />
                <span className="sr-only">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center" role="alert">
                <p className="text-md-body-medium text-md-sys-error">{error}</p>
                <button
                  onClick={() => {
                    fetchNotifications();
                    setStatusMessage('Retrying to load notifications');
                  }}
                  className={cn(
                    'mt-2 text-md-label-medium text-md-sys-primary',
                    'hover:text-md-sys-primary/80 hover:bg-md-sys-primary/8',
                    'px-3 py-1 rounded-lg transition-all duration-md-short2 ease-md-standard',
                    'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
                  )}
                  aria-label="Retry loading notifications"
                >
                  Try again
                </button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center" role="region" aria-label="No notifications">
                <Bell className="mx-auto h-8 w-8 text-md-sys-on-surface-variant mb-2" aria-hidden="true" />
                <p className="text-md-body-medium text-md-sys-on-surface-variant">No notifications yet</p>
                <p className="text-md-body-small text-md-sys-on-surface-variant/70 mt-1">
                  You'll see new messages and updates here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-md-sys-outline-variant" role="list" aria-label={`${recentNotifications.length} notifications`}>
                {recentNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    ref={index === 0 ? firstNotificationRef : undefined}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Footer */}
          {notifications.length > 0 && (
            <footer className={cn(
              'px-4 py-3 border-t border-md-sys-outline-variant',
              'bg-md-sys-surface-container-lowest rounded-b-xl'
            )}>
              <button
                onClick={() => {
                  // Navigate to full notifications page (to be implemented)
                  setIsOpen(false);
                  setStatusMessage('Opening full notifications page');
                }}
                className={cn(
                  'w-full text-center text-md-label-large text-md-sys-primary',
                  'hover:text-md-sys-primary/80 hover:bg-md-sys-primary/8',
                  'py-2 px-4 rounded-lg font-medium',
                  'transition-all duration-md-short2 ease-md-standard',
                  'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
                )}
                role="menuitem"
                aria-label={`View all ${notifications.length} notifications in full page`}
              >
                View all notifications
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: OfferNotification;
  onClick: () => void;
  onMarkAsRead: () => void;
}

const NotificationItem = React.forwardRef<HTMLButtonElement, NotificationItemProps>(
  function NotificationItem({ notification, onClick, onMarkAsRead }, ref) {
    const [showActions, setShowActions] = useState(false);
    const itemId = useId();
    const actionId = useId();

    const getNotificationIcon = (type: string, icon?: string) => {
      // Use the emoji icon from the API if available
      if (icon) {
        return <span className="text-lg" aria-hidden="true">{icon}</span>;
      }

      switch (type) {
        case 'offer_received':
          return <span className="text-lg" aria-hidden="true">💰</span>;
        case 'offer_accepted':
          return <span className="text-lg" aria-hidden="true">✅</span>;
        case 'offer_rejected':
          return <span className="text-lg" aria-hidden="true">❌</span>;
        case 'offer_countered':
        case 'counter_offer_received':
          return <span className="text-lg" aria-hidden="true">🔄</span>;
        case 'offer_expired':
          return <span className="text-lg" aria-hidden="true">⏰</span>;
        default:
          return <Bell className="h-4 w-4" aria-hidden="true" />;
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'offer_received':
          return 'text-green-600';
        case 'offer_accepted':
          return 'text-green-600';
        case 'offer_rejected':
          return 'text-red-600';
        case 'offer_countered':
        case 'counter_offer_received':
          return 'text-blue-600';
        case 'offer_expired':
          return 'text-gray-600';
        default:
          return 'text-md-sys-on-surface-variant';
      }
    };

    const getNotificationTypeLabel = (type: string): string => {
      switch (type) {
        case 'offer_received':
          return 'Offer received';
        case 'offer_accepted':
          return 'Offer accepted';
        case 'offer_rejected':
          return 'Offer rejected';
        case 'offer_countered':
        case 'counter_offer_received':
          return 'Counter offer received';
        case 'offer_expired':
          return 'Offer expired';
        default:
          return 'Notification';
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const offerDetails = notification.offer ? 
      `${formatCurrency(notification.offer.offer_amount)} for ${notification.offer.listing.year} ${notification.offer.listing.make} ${notification.offer.listing.model}` : '';

    return (
      <div
        role="listitem"
        className={cn(
          'px-4 py-3 hover:bg-md-sys-on-surface/8 cursor-pointer',
          'transition-all duration-md-short2 ease-md-standard relative',
          !notification.is_read && 'bg-md-sys-primary/8'
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        aria-labelledby={itemId}
      >
        <button
          ref={ref}
          onClick={onClick}
          className="w-full text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2 focus-visible:rounded-lg"
          role="menuitem"
          aria-describedby={actionId}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={cn('flex-shrink-0', getTypeColor(notification.notification_type))}>
              {getNotificationIcon(notification.notification_type, notification.icon)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p 
                    id={itemId}
                    className={cn(
                      'text-md-body-medium font-medium',
                      !notification.is_read ? 'text-md-sys-on-surface' : 'text-md-sys-on-surface-variant'
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className={cn(
                    'text-md-body-medium mt-1',
                    !notification.is_read ? 'text-md-sys-on-surface-variant' : 'text-md-sys-on-surface-variant/70'
                  )}>
                    {notification.message}
                  </p>
                  
                  {/* Show offer details if available */}
                  {notification.offer && (
                    <div className="mt-2 text-md-body-small text-md-sys-on-surface-variant/70">
                      {offerDetails}
                    </div>
                  )}

                  <div className="flex items-center mt-2 space-x-2">
                    <p className="text-md-body-small text-md-sys-on-surface-variant/70">
                      {notification.time_ago}
                    </p>
                    <span className="text-md-body-small text-md-sys-outline" aria-hidden="true">•</span>
                    <span className={cn(
                      'text-md-body-small text-md-sys-primary font-medium',
                      'flex items-center hover:text-md-sys-primary/80',
                      'transition-colors duration-md-short2'
                    )}>
                      View details
                      <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="flex-shrink-0 ml-2" aria-hidden="true">
                    <div className="h-2 w-2 bg-md-sys-primary rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Hidden accessible description */}
          <div id={actionId} className="sr-only">
            {getNotificationTypeLabel(notification.notification_type)}. 
            {offerDetails && ` ${offerDetails}.`}
            {` Received ${notification.time_ago}.`}
            {!notification.is_read ? ' Unread.' : ''}
            {notification.action_url ? ' Click to view details.' : ''}
          </div>
        </button>

        {/* Actions */}
        {showActions && !notification.is_read && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-full',
                'text-md-sys-on-surface-variant hover:text-md-sys-on-surface',
                'hover:bg-md-sys-on-surface/8 focus:bg-md-sys-on-surface/12',
                'transition-all duration-md-short2 ease-md-standard',
                'focus:outline-none focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2'
              )}
              aria-label={`Mark "${notification.title}" as read`}
              title="Mark as read"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    );
  }
); 