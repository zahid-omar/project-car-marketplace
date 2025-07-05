'use client';

import React, { useState, useEffect } from 'react';
import { BellIcon, ClockIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_new_messages: boolean;
  in_app_replies: boolean;
  in_app_mentions: boolean;
  email_new_messages: boolean;
  email_replies: boolean;
  email_mentions: boolean;
  email_daily_digest: boolean;
  push_new_messages: boolean;
  push_replies: boolean;
  push_mentions: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationPreferencesProps {
  className?: string;
}

export default function NotificationPreferences({ className = '' }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile/notification-preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Only send the preference fields that the API expects, not database metadata
      const updatedPreferences = { ...preferences, ...updates };
      const preferenceData = {
        in_app_new_messages: updatedPreferences.in_app_new_messages,
        in_app_replies: updatedPreferences.in_app_replies,
        in_app_mentions: updatedPreferences.in_app_mentions,
        email_new_messages: updatedPreferences.email_new_messages,
        email_replies: updatedPreferences.email_replies,
        email_mentions: updatedPreferences.email_mentions,
        email_daily_digest: updatedPreferences.email_daily_digest,
        push_new_messages: updatedPreferences.push_new_messages,
        push_replies: updatedPreferences.push_replies,
        push_mentions: updatedPreferences.push_mentions,
        quiet_hours_enabled: updatedPreferences.quiet_hours_enabled,
        // Include quiet hours times if they exist or are being set
        ...(updatedPreferences.quiet_hours_start ? { quiet_hours_start: updatedPreferences.quiet_hours_start } : {}),
        ...(updatedPreferences.quiet_hours_end ? { quiet_hours_end: updatedPreferences.quiet_hours_end } : {})
      };

      const response = await fetch('/api/profile/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccessMessage(data.message || 'Preferences updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.message || 'Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
    // Special handling for quiet hours - provide default times when enabling
    if (field === 'quiet_hours_enabled' && value === true) {
      updatePreferences({ 
        [field]: value,
        quiet_hours_start: preferences?.quiet_hours_start || '22:00',
        quiet_hours_end: preferences?.quiet_hours_end || '08:00'
      });
    } else {
      updatePreferences({ [field]: value });
    }
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    updatePreferences({
      quiet_hours_start: start,
      quiet_hours_end: end
    });
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={cn('text-center py-8', className)}>
        <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No preferences found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load your notification preferences.</p>
        <button
          onClick={fetchPreferences}
          className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage how and when you receive notifications from our platform.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {/* In-App Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BellIcon className="h-5 w-5 text-automotive-accent" />
          <h4 className="text-md font-medium text-gray-900">In-App Notifications</h4>
        </div>
        
        <div className="space-y-3 ml-7">
          <NotificationToggle
            label="New Messages"
            description="Get notified when someone sends you a message"
            checked={preferences.in_app_new_messages}
            onChange={(checked) => handleToggle('in_app_new_messages', checked)}
            disabled={saving}
          />
          
          <NotificationToggle
            label="Message Replies"
            description="Get notified when someone replies to your message"
            checked={preferences.in_app_replies}
            onChange={(checked) => handleToggle('in_app_replies', checked)}
            disabled={saving}
          />
          
          <NotificationToggle
            label="Mentions"
            description="Get notified when someone mentions you in a conversation"
            checked={preferences.in_app_mentions}
            onChange={(checked) => handleToggle('in_app_mentions', checked)}
            disabled={saving}
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <EnvelopeIcon className="h-5 w-5 text-automotive-accent" />
          <h4 className="text-md font-medium text-gray-900">Email Notifications</h4>
        </div>
        
        <div className="space-y-3 ml-7">
          <NotificationToggle
            label="New Messages"
            description="Receive email notifications for new messages"
            checked={preferences.email_new_messages}
            onChange={(checked) => handleToggle('email_new_messages', checked)}
            disabled={saving}
          />
          
          <NotificationToggle
            label="Message Replies"
            description="Receive email notifications for message replies"
            checked={preferences.email_replies}
            onChange={(checked) => handleToggle('email_replies', checked)}
            disabled={saving}
          />
          
          <NotificationToggle
            label="Mentions"
            description="Receive email notifications when mentioned"
            checked={preferences.email_mentions}
            onChange={(checked) => handleToggle('email_mentions', checked)}
            disabled={saving}
          />
          
          <NotificationToggle
            label="Daily Digest"
            description="Receive a daily summary of your notifications"
            checked={preferences.email_daily_digest}
            onChange={(checked) => handleToggle('email_daily_digest', checked)}
            disabled={saving}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <DevicePhoneMobileIcon className="h-5 w-5 text-automotive-accent" />
          <h4 className="text-md font-medium text-gray-900">Push Notifications</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            Future Feature
          </span>
        </div>
        
        <div className="space-y-3 ml-7">
          <NotificationToggle
            label="New Messages"
            description="Receive push notifications for new messages"
            checked={preferences.push_new_messages}
            onChange={(checked) => handleToggle('push_new_messages', checked)}
            disabled={true}
          />
          
          <NotificationToggle
            label="Message Replies"
            description="Receive push notifications for message replies"
            checked={preferences.push_replies}
            onChange={(checked) => handleToggle('push_replies', checked)}
            disabled={true}
          />
          
          <NotificationToggle
            label="Mentions"
            description="Receive push notifications when mentioned"
            checked={preferences.push_mentions}
            onChange={(checked) => handleToggle('push_mentions', checked)}
            disabled={true}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-automotive-accent" />
          <h4 className="text-md font-medium text-gray-900">Quiet Hours</h4>
        </div>
        
        <div className="ml-7">
          <NotificationToggle
            label="Enable Quiet Hours"
            description="Pause non-urgent notifications during specified hours"
            checked={preferences.quiet_hours_enabled}
            onChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
            disabled={saving}
          />
          
          {preferences.quiet_hours_enabled && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => handleQuietHoursChange(
                    e.target.value,
                    preferences.quiet_hours_end || '08:00'
                  )}
                  disabled={saving}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-automotive-accent focus:border-automotive-accent sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => handleQuietHoursChange(
                    preferences.quiet_hours_start || '22:00',
                    e.target.value
                  )}
                  disabled={saving}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-automotive-accent focus:border-automotive-accent sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save indicator */}
      {saving && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-gray-600">Saving preferences...</span>
        </div>
      )}
    </div>
  );
}

// Toggle component for notification settings
interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}: NotificationToggleProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-automotive-accent focus:ring-automotive-accent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
      <div className="flex-1">
        <label className={cn(
          'text-sm font-medium text-gray-700',
          disabled && 'opacity-50'
        )}>
          {label}
        </label>
        <p className={cn(
          'text-sm text-gray-500',
          disabled && 'opacity-50'
        )}>
          {description}
        </p>
      </div>
    </div>
  );
} 