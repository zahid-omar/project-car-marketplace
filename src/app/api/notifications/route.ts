import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { CreateNotificationRequest, NOTIFICATION_TEMPLATES } from '@/types/messages';

const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['message', 'reply', 'mention', 'system']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  action_url: z.string().optional(),
  action_label: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  expires_at: z.string().optional(),
  icon: z.string().optional(),
  related_entity_id: z.string().optional(),
  related_entity_type: z.enum(['message', 'listing', 'user']).optional()
});

const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid())
});

const updateNotificationSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  mark_all_read: z.boolean().optional(),
  is_read: z.boolean()
});

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type'); // Filter by notification type

    let query = supabase
      .from('offer_notifications')
      .select(`
        *,
        offer:offers(
          id,
          offer_amount,
          status,
          listing:listings(
            id,
            title,
            make,
            model,
            year,
            price,
            listing_images(image_url, is_primary)
          ),
          buyer:profiles!offers_buyer_id_fkey(
            id,
            display_name,
            profile_image_url
          ),
          seller:profiles!offers_seller_id_fkey(
            id,
            display_name,
            profile_image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by unread status
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    // Filter by notification type
    if (type) {
      query = query.eq('notification_type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('offer_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      console.warn('Error getting unread count:', countError);
    }

    // Enhance notifications with additional context
    const enhancedNotifications = notifications?.map(notification => ({
      ...notification,
      time_ago: getTimeAgo(notification.created_at),
      action_url: getNotificationActionUrl(notification),
      icon: getNotificationIcon(notification.notification_type)
    })) || [];

    return NextResponse.json({
      notifications: enhancedNotifications,
      unread_count: unreadCount || 0,
      total: notifications?.length || 0,
      has_more: notifications?.length === limit
    });

  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', validatedData.user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Create the notification
    const { data: notification, error } = await supabase
      .from('in_app_notifications')
      .insert({
        user_id: validatedData.user_id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        action_url: validatedData.action_url,
        action_label: validatedData.action_label,
        priority: validatedData.priority,
        expires_at: validatedData.expires_at,
        icon: validatedData.icon,
        related_entity_id: validatedData.related_entity_id,
        related_entity_type: validatedData.related_entity_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Create notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - Update notification read status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { notification_ids, mark_all_read, is_read } = validation.data;

    let query = supabase
      .from('offer_notifications')
      .update({
        is_read,
        read_at: is_read ? new Date().toISOString() : null
      })
      .eq('user_id', user.id);

    if (mark_all_read) {
      // Mark all notifications as read
      query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Always true condition
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications
      query = query.in('id', notification_ids);
    } else {
      return NextResponse.json(
        { error: 'Must specify notification_ids or mark_all_read' },
        { status: 400 }
      );
    }

    const { data: updatedNotifications, error: updateError } = await query.select('id, is_read');

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedNotifications?.length || 0,
      updated_notifications: updatedNotifications
    });

  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',') || [];
    const deleteAll = searchParams.get('delete_all') === 'true';
    const olderThanDays = searchParams.get('older_than_days');

    if (!deleteAll && notificationIds.length === 0 && !olderThanDays) {
      return NextResponse.json(
        { error: 'Must specify notification IDs, delete_all, or older_than_days' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('offer_notifications')
      .delete()
      .eq('user_id', user.id);

    if (deleteAll) {
      // Delete all notifications (with safety check)
      query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    } else if (olderThanDays) {
      // Delete notifications older than specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
      query = query.lt('created_at', cutoffDate.toISOString());
    } else {
      // Delete specific notifications
      query = query.in('id', notificationIds);
    }

    const { count, error: deleteError } = await query;

    if (deleteError) {
      console.error('Error deleting notifications:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_count: count || 0
    });

  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function getNotificationActionUrl(notification: any): string {
  const offerId = notification.offer_id;
  const offerStatus = notification.offer?.status;
  
  // Navigate to appropriate section based on notification type and user role
  if (notification.notification_type === 'offer_received') {
    return `/dashboard#offer-management`;
  } else if (notification.notification_type === 'offer_accepted' || 
             notification.notification_type === 'offer_rejected' ||
             notification.notification_type === 'counter_offer_received') {
    return `/dashboard#sent-offers`;
  } else if (notification.notification_type === 'offer_expired') {
    return `/dashboard#offer-analytics`;
  }
  
  return `/dashboard`;
}

function getNotificationIcon(notificationType: string): string {
  const icons = {
    'offer_received': '💰',
    'offer_accepted': '✅',
    'offer_rejected': '❌',
    'offer_countered': '🔄',
    'offer_expired': '⏰',
    'counter_offer_received': '💬'
  };
  
  return icons[notificationType as keyof typeof icons] || '📬';
}

// Helper function to create notifications from templates
export async function createNotificationFromTemplate(
  templateKey: string,
  userId: string,
  variables: Record<string, string>,
  options?: Partial<CreateNotificationRequest>
) {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Notification template '${templateKey}' not found`);
  }

  // Replace template variables
  let title = template.title_template;
  let message = template.message_template;

  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value);
    message = message.replace(`{${key}}`, value);
  });

  const notificationData: CreateNotificationRequest = {
    user_id: userId,
    type: template.type as any,
    title,
    message,
    action_label: template.action_label,
    icon: template.icon,
    priority: template.priority,
    ...options
  };

  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification from template:', error);
    throw error;
  }
} 