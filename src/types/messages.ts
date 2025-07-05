export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  read_at?: string;
  // Threading fields
  thread_id?: string;
  parent_message_id?: string;
  thread_depth?: number;
  thread_order?: number;
  // Extended fields for enhanced functionality
  message_type?: 'text' | 'inquiry' | 'offer' | 'system';
  is_deleted?: boolean;
  // Moderation fields
  is_flagged?: boolean;
  flagged_at?: string;
  flagged_by?: string;
  flag_reason?: string;
  moderation_status?: 'pending' | 'approved' | 'rejected' | 'hidden';
  moderated_at?: string;
  moderated_by?: string;
}

export interface MessageWithProfiles extends Message {
  sender: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    email: string;
  };
  recipient: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    email: string;
  };
  listing?: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
  };
  // Threading relationships
  parent_message?: MessageWithProfiles;
  replies?: MessageWithProfiles[];
  reply_count?: number;
}

export interface ThreadedMessage extends MessageWithProfiles {
  thread_root?: boolean; // True if this is the root message of a thread
  has_replies?: boolean;
  children?: ThreadedMessage[];
  depth_level?: number;
}

export interface Conversation {
  id: string;
  listing_id: string;
  participants: string[]; // Array of user IDs
  last_message: MessageWithProfiles;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
    user_id: string; // seller ID
  };
  other_participant: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    email: string;
  };
  messages: MessageWithProfiles[];
}

export interface SendMessageRequest {
  listing_id: string;
  recipient_id: string;
  message_text: string;
  message_type?: 'text' | 'inquiry' | 'offer';
  parent_message_id?: string;
  thread_id?: string;
}

export interface ReplyToMessageRequest {
  parent_message_id: string;
  message_text: string;
  message_type?: 'text' | 'inquiry' | 'offer';
}

export interface MessageNotification {
  id: string;
  user_id: string;
  message_id: string;
  type: 'new_message' | 'new_reply' | 'message_read' | 'mention';
  is_read: boolean;
  created_at: string;
  read_at?: string;
  // Additional notification data
  title: string;
  body: string;
  action_url?: string;
  sender?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  listing?: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
  };
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  // In-app notifications
  in_app_new_messages: boolean;
  in_app_replies: boolean;
  in_app_mentions: boolean;
  // Email notifications
  email_new_messages: boolean;
  email_replies: boolean;
  email_mentions: boolean;
  email_daily_digest: boolean;
  // Push notifications (for future implementation)
  push_new_messages: boolean;
  push_replies: boolean;
  push_mentions: boolean;
  // Timing preferences
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  created_at: string;
  updated_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  type: 'message' | 'reply' | 'mention' | 'system';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  // Additional metadata
  priority: 'low' | 'medium' | 'high';
  expires_at?: string;
  icon?: string;
  related_entity_id?: string; // message_id, listing_id, etc.
  related_entity_type?: 'message' | 'listing' | 'user';
}

export interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: 'message' | 'reply' | 'mention' | 'system';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string;
  icon?: string;
  related_entity_id?: string;
  related_entity_type?: 'message' | 'listing' | 'user';
}

export interface NotificationDeliveryOptions {
  in_app: boolean;
  email: boolean;
  push: boolean;
  respect_quiet_hours: boolean;
  immediate: boolean;
}

// Notification templates for consistent messaging
export interface NotificationTemplate {
  type: string;
  title_template: string;
  message_template: string;
  action_label?: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high';
  default_delivery: NotificationDeliveryOptions;
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  new_message: {
    type: 'message',
    title_template: 'New message from {sender_name}',
    message_template: 'You have a new message about {listing_title}',
    action_label: 'View Message',
    icon: 'message',
    priority: 'medium',
    default_delivery: {
      in_app: true,
      email: true,
      push: true,
      respect_quiet_hours: true,
      immediate: true
    }
  },
  new_reply: {
    type: 'reply',
    title_template: '{sender_name} replied to your message',
    message_template: 'New reply about {listing_title}',
    action_label: 'View Reply',
    icon: 'reply',
    priority: 'medium',
    default_delivery: {
      in_app: true,
      email: true,
      push: true,
      respect_quiet_hours: true,
      immediate: true
    }
  },
  message_read: {
    type: 'message',
    title_template: 'Your message was read',
    message_template: '{recipient_name} read your message about {listing_title}',
    action_label: 'View Conversation',
    icon: 'read',
    priority: 'low',
    default_delivery: {
      in_app: true,
      email: false,
      push: false,
      respect_quiet_hours: true,
      immediate: false
    }
  },
  mention: {
    type: 'mention',
    title_template: '{sender_name} mentioned you',
    message_template: 'You were mentioned in a conversation about {listing_title}',
    action_label: 'View Mention',
    icon: 'mention',
    priority: 'high',
    default_delivery: {
      in_app: true,
      email: true,
      push: true,
      respect_quiet_hours: false,
      immediate: true
    }
  }
};

export interface MessagingState {
  conversations: ConversationWithDetails[];
  activeConversation: ConversationWithDetails | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface MessageFormData {
  message_text: string;
  message_type: 'text' | 'inquiry' | 'offer';
}

// For message templates
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  type: 'inquiry' | 'offer' | 'general';
  variables?: string[]; // Placeholders like {listing_title}, {price}, etc.
}

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'inquiry-general',
    title: 'General Inquiry',
    content: 'Hi, I\'m interested in your {listing_title}. Is it still available?',
    type: 'inquiry',
    variables: ['listing_title']
  },
  {
    id: 'inquiry-details',
    title: 'Ask for Details',
    content: 'Hi, I\'d like to know more about your {listing_title}. Can you provide more details about its condition and history?',
    type: 'inquiry',
    variables: ['listing_title']
  },
  {
    id: 'inquiry-viewing',
    title: 'Request Viewing',
    content: 'Hi, I\'m very interested in your {listing_title}. Would it be possible to arrange a viewing?',
    type: 'inquiry',
    variables: ['listing_title']
  },
  {
    id: 'offer-negotiation',
    title: 'Make Offer',
    content: 'Hi, I\'m interested in your {listing_title}. Would you consider {offer_amount} for it?',
    type: 'offer',
    variables: ['listing_title', 'offer_amount']
  }
];

// Reporting and Moderation Types
export interface MessageReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'offensive' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  resolution_notes?: string;
  
  // Related data
  message?: MessageWithProfiles;
  reporter?: {
    id: string;
    display_name: string;
    email: string;
  };
  reported_user?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface CreateReportRequest {
  message_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'offensive' | 'other';
  description?: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: 'message' | 'user' | 'conversation';
  target_id: string;
  action_type: 'flag' | 'hide' | 'delete' | 'warn' | 'suspend' | 'ban';
  reason?: string;
  notes?: string;
  expires_at?: string;
  created_at: string;
  
  // Related data
  moderator?: {
    id: string;
    display_name: string;
    email: string;
    role: string;
  };
}

export interface UserModerationStatus {
  user_id: string;
  is_suspended: boolean;
  is_banned: boolean;
  suspension_reason?: string;
  suspension_expires_at?: string;
  banned_reason?: string;
  banned_at?: string;
  warning_count: number;
  last_warning_at?: string;
}

export interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  flagged_messages: number;
  suspended_users: number;
  banned_users: number;
  reports_by_reason: {
    [key: string]: number;
  };
}

export interface ReportFormData {
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'offensive' | 'other';
  description: string;
}

export const REPORT_REASONS = {
  spam: {
    label: 'Spam',
    description: 'Repetitive, unwanted, or promotional content'
  },
  harassment: {
    label: 'Harassment',
    description: 'Bullying, threats, or targeted abuse'
  },
  inappropriate: {
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines'
  },
  scam: {
    label: 'Scam or Fraud',
    description: 'Fraudulent listings or deceptive practices'
  },
  offensive: {
    label: 'Offensive Language',
    description: 'Hate speech, profanity, or discriminatory language'
  },
  other: {
    label: 'Other',
    description: 'Other violations not listed above'
  }
} as const; 