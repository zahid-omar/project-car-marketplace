import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/utils';

const sendMessageSchema = z.object({
  listing_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  message_text: z.string().min(1).max(5000),
  message_type: z.enum(['text', 'inquiry', 'offer']).optional().default('text'),
  parent_message_id: z.string().uuid().optional(),
  thread_id: z.string().uuid().optional()
});

const markReadSchema = z.object({
  message_ids: z.array(z.string().uuid())
});

const archiveConversationSchema = z.object({
  conversation_ids: z.array(z.string()),
  archive: z.boolean().optional().default(true)
});

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversation_id');
    const includeArchived = url.searchParams.get('include_archived') === 'true';
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (conversationId) {
      // Get threaded messages for a specific conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id, display_name, profile_image_url, email
          ),
          recipient:profiles!messages_recipient_id_fkey(
            id, display_name, profile_image_url, email
          ),
          listing:listings(
            id, title, make, model, year, price, status, user_id
          )
        `)
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('listing_id', conversationId)
        .eq('is_deleted', false)
        .order('thread_order', { ascending: true })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      // Build threaded structure
      const threadedMessages = buildMessageThreads(messages || []);
      
      return NextResponse.json({ 
        messages: messages || [], 
        threaded_messages: threadedMessages 
      });
    } else {
      // Get all conversations for the user
      // First, get all messages where user is sender or recipient
      let messagesQuery = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id, display_name, profile_image_url, email
          ),
          recipient:profiles!messages_recipient_id_fkey(
            id, display_name, profile_image_url, email
          ),
          listing:listings(
            id, title, make, model, year, price, status, user_id
          )
        `)
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Apply search filter if provided
      if (search) {
        messagesQuery = messagesQuery.ilike('message_text', `%${search}%`);
      }

      const { data: messages, error: messagesError } = await messagesQuery;

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
      }

      // Get conversation settings for archive status (if table exists)
      let conversationSettings: any[] = [];
      try {
        const { data, error: settingsError } = await supabase
          .from('conversation_settings')
          .select('*')
          .eq('user_id', session.user.id);

        if (settingsError) {
          console.log('Conversation settings table not available:', settingsError.message);
        } else {
          conversationSettings = data || [];
        }
      } catch (error) {
        console.log('Conversation settings feature not yet available');
      }

      // Group messages by conversation (listing_id + other participant)
      const conversationMap = new Map();
      
      (messages || []).forEach((message: any) => {
        // Handle self-conversations (when sender_id === recipient_id)
        const isSelfConversation = message.sender_id === message.recipient_id;
        const otherParticipantId = isSelfConversation 
          ? message.sender_id // Use same ID for self-conversations
          : (message.sender_id === session.user.id ? message.recipient_id : message.sender_id);
        
        const conversationKey = `${message.listing_id}`;
        const settingsForConversation = conversationSettings.find((s: any) => 
          s.listing_id === message.listing_id && s.other_participant_id === otherParticipantId
        );
        
        const isArchived = settingsForConversation?.is_archived || false;
        
        // Skip archived conversations unless explicitly requested
        if (isArchived && !includeArchived) {
          return;
        }

        if (!conversationMap.has(conversationKey)) {
          // Calculate unread count for this conversation
          // For self-conversations, consider messages unread if they are specifically marked as unread
          const unreadCount = isSelfConversation 
            ? (messages || []).filter((m: any) => 
                m.listing_id === message.listing_id && !m.is_read
              ).length
            : (messages || []).filter((m: any) => 
                m.listing_id === message.listing_id &&
                m.recipient_id === session.user.id &&
                !m.is_read
              ).length;

          // For self-conversations, use the sender profile for display
          const displayParticipant = isSelfConversation 
            ? message.sender 
            : (message.sender_id === session.user.id ? message.recipient : message.sender);

          conversationMap.set(conversationKey, {
            id: conversationKey,
            listing_id: message.listing_id,
            participants: isSelfConversation 
              ? [session.user.id] 
              : [session.user.id, otherParticipantId],
            last_message: {
              id: message.id,
              listing_id: message.listing_id,
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              message_text: message.message_text,
              is_read: message.is_read,
              created_at: message.created_at,
              updated_at: message.updated_at,
              message_type: message.message_type || 'text'
            },
            unread_count: unreadCount,
            created_at: message.created_at,
            updated_at: message.created_at,
            is_archived: isArchived,
            listing: message.listing,
            other_participant: displayParticipant,
            other_participant_id: otherParticipantId,
            last_message_text: message.message_text,
            last_message_created_at: message.created_at,
            is_self_conversation: isSelfConversation,
            messages: []
          });
        } else {
          // Update if this message is more recent
          const existing = conversationMap.get(conversationKey);
          if (new Date(message.created_at) > new Date(existing.last_message.created_at)) {
            existing.last_message = {
              id: message.id,
              listing_id: message.listing_id,
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              message_text: message.message_text,
              is_read: message.is_read,
              created_at: message.created_at,
              updated_at: message.updated_at,
              message_type: message.message_type || 'text'
            };
            existing.last_message_text = message.message_text;
            existing.last_message_created_at = message.created_at;
            existing.updated_at = message.created_at;
          }
        }
      });

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(offset, offset + limit);

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Verify the recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', validatedData.recipient_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Verify the listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', validatedData.listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Handle threading logic
    let threadId = validatedData.thread_id;
    let threadDepth = 0;
    let threadOrder = 0;

    if (validatedData.parent_message_id) {
      // This is a reply - get parent message info
      const { data: parentMessage, error: parentError } = await supabase
        .from('messages')
        .select('thread_id, thread_depth, thread_order')
        .eq('id', validatedData.parent_message_id)
        .single();

      if (parentError || !parentMessage) {
        return NextResponse.json({ error: 'Parent message not found' }, { status: 404 });
      }

      threadId = parentMessage.thread_id || validatedData.parent_message_id;
      threadDepth = (parentMessage.thread_depth || 0) + 1;
      
      // Get the next thread_order for this conversation
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('thread_order')
        .eq('listing_id', validatedData.listing_id)
        .order('thread_order', { ascending: false })
        .limit(1)
        .single();
      
      threadOrder = (lastMessage?.thread_order || 0) + 1;
    } else {
      // This is a new thread
      threadId = undefined; // Will be set to message ID after creation
      threadDepth = 0;
      threadOrder = 0;

      // Get the next thread_order for this conversation
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('thread_order')
        .eq('listing_id', validatedData.listing_id)
        .order('thread_order', { ascending: false })
        .limit(1)
        .single();
      
      threadOrder = (lastMessage?.thread_order || 0) + 1;
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        listing_id: validatedData.listing_id,
        sender_id: session.user.id,
        recipient_id: validatedData.recipient_id,
        message_text: validatedData.message_text,
        message_type: validatedData.message_type,
        parent_message_id: validatedData.parent_message_id,
        thread_id: threadId,
        thread_depth: threadDepth,
        thread_order: threadOrder
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, display_name, profile_image_url, email
        ),
        recipient:profiles!messages_recipient_id_fkey(
          id, display_name, profile_image_url, email
        ),
        listing:listings(
          id, title, make, model, year, price, status
        )
      `)
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // If this is a new thread (no parent), set thread_id to the message ID
    if (!validatedData.parent_message_id && message) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ thread_id: message.id })
        .eq('id', message.id);

      if (updateError) {
        console.error('Error updating thread_id:', updateError);
      } else {
        // Update the returned message object
        message.thread_id = message.id;
      }
    }

    // Create notification for the recipient
    try {
      const notificationTitle = validatedData.parent_message_id 
        ? `${message.sender.display_name} replied to your message`
        : `New message from ${message.sender.display_name}`;

      const notificationMessage = `Message about ${message.listing.year} ${message.listing.make} ${message.listing.model}`;
      
      const actionUrl = `/messages?conversation=${validatedData.listing_id}`;

      await supabase.from('in_app_notifications').insert({
        user_id: validatedData.recipient_id,
        type: validatedData.parent_message_id ? 'reply' : 'message',
        title: notificationTitle,
        message: notificationMessage,
        action_url: actionUrl,
        action_label: 'View Message',
        priority: 'medium',
        icon: validatedData.parent_message_id ? 'reply' : 'message',
        related_entity_id: message.id,
        related_entity_type: 'message'
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the message send if notification creation fails
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Send message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/messages - Mark messages as read or archive/unarchive conversations
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error('Auth error in PATCH messages:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversation_id');
    const action = url.searchParams.get('action'); // 'mark_read' or 'archive'

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      body = {};
    }

    if (action === 'archive') {
      // Archive or unarchive conversations
      const validatedData = archiveConversationSchema.parse(body);
      
      // Create or update conversation_settings for archiving (if table exists)
      const conversationKeys = validatedData.conversation_ids;
      const archiveValue = validatedData.archive;

      try {
        for (const key of conversationKeys) {
          const [listingId, otherParticipantId] = key.split('-');
          
          // Use upsert to handle conversation settings
          const { error: upsertError } = await supabase
            .from('conversation_settings')
            .upsert({
              user_id: session.user.id,
              listing_id: listingId,
              other_participant_id: otherParticipantId,
              is_archived: archiveValue,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,listing_id,other_participant_id'
            });

          if (upsertError) {
            console.error('Error archiving conversation:', upsertError);
            return NextResponse.json({ 
              error: 'Failed to archive conversation', 
              details: getErrorMessage(upsertError) 
            }, { status: 500 });
          }
        }
      } catch (error) {
        console.log('Archive feature not yet available - conversation_settings table missing');
        return NextResponse.json({ 
          error: 'Archive feature not yet available',
          message: 'This feature requires database migration'
        }, { status: 501 });
      }

      return NextResponse.json({ 
        message: `Conversations ${archiveValue ? 'archived' : 'unarchived'} successfully`,
        updated_count: conversationKeys.length
      });

    } else {
      // Mark messages as read (existing functionality)
      if (conversationId) {
        // Mark all unread messages in a conversation as read
        console.log(`Marking conversation ${conversationId} as read for user ${session.user.id}`);
        
        // First, check if this is a self-conversation by looking at any message in the conversation
        const { data: sampleMessage } = await supabase
          .from('messages')
          .select('sender_id, recipient_id')
          .eq('listing_id', conversationId)
          .limit(1)
          .single();

        const isSelfConversation = sampleMessage && 
          sampleMessage.sender_id === sampleMessage.recipient_id &&
          sampleMessage.sender_id === session.user.id;

        let updatedMessages;
        let error;

        if (isSelfConversation) {
          // For self-conversations, mark all unread messages as read regardless of sender/recipient
          ({ data: updatedMessages, error } = await supabase
            .from('messages')
            .update({ 
              is_read: true,
              read_at: new Date().toISOString()
            })
            .eq('listing_id', conversationId)
            .eq('sender_id', session.user.id)
            .eq('is_read', false)
            .select('id'));
        } else {
          // For regular conversations, only mark messages where user is recipient
          ({ data: updatedMessages, error } = await supabase
            .from('messages')
            .update({ 
              is_read: true,
              read_at: new Date().toISOString()
            })
            .eq('listing_id', conversationId)
            .eq('recipient_id', session.user.id)
            .eq('is_read', false)
            .select('id'));
        }

        if (error) {
          console.error('Error marking conversation as read:', error);
          return NextResponse.json({ 
            error: 'Failed to mark conversation as read', 
            details: error.message 
          }, { status: 500 });
        }

        console.log(`Successfully marked ${updatedMessages?.length || 0} messages as read`);
        
        return NextResponse.json({ 
          message: 'Conversation marked as read', 
          updated_count: updatedMessages?.length || 0 
        });
      } else {
        // Mark specific messages as read
        const validatedData = markReadSchema.parse(body);

        const { data: updatedMessages, error } = await supabase
          .from('messages')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString()
          })
          .in('id', validatedData.message_ids)
          .eq('recipient_id', session.user.id)
          .select('id');

        if (error) {
          console.error('Error marking messages as read:', error);
          return NextResponse.json({ 
            error: 'Failed to mark messages as read', 
            details: error.message 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          message: 'Messages marked as read', 
          updated_count: updatedMessages?.length || 0 
        });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error in PATCH messages:', error.errors);
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Mark read API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE /api/messages - Delete conversations or individual messages
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationIds = url.searchParams.get('conversation_ids')?.split(',') || [];
    const messageIds = url.searchParams.get('message_ids')?.split(',') || [];
    const softDelete = url.searchParams.get('soft_delete') === 'true';

    if (conversationIds.length > 0) {
      // Delete entire conversations
      for (const key of conversationIds) {
        const [listingId, otherParticipantId] = key.split('-');
        
        if (softDelete) {
          // Soft delete: mark messages as deleted for this user
          const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('listing_id', listingId)
            .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`);

          if (error) {
            console.error('Error soft deleting conversation:', error);
            return NextResponse.json({ 
              error: 'Failed to delete conversation', 
              details: error.message 
            }, { status: 500 });
          }
        } else {
          // Hard delete: only allow if user is sender of all messages
          const { data: messages, error: fetchError } = await supabase
            .from('messages')
            .select('id, sender_id')
            .eq('listing_id', listingId)
            .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`);

          if (fetchError) {
            console.error('Error fetching messages for deletion:', fetchError);
            return NextResponse.json({ 
              error: 'Failed to fetch messages for deletion', 
              details: fetchError.message 
            }, { status: 500 });
          }

          // Check if user is authorized to delete all messages
          const unauthorizedMessages = messages?.filter(msg => msg.sender_id !== session.user.id);
          if (unauthorizedMessages && unauthorizedMessages.length > 0) {
            return NextResponse.json({ 
              error: 'Cannot delete messages sent by other users' 
            }, { status: 403 });
          }

          // Delete messages
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('listing_id', listingId)
            .eq('sender_id', session.user.id);

          if (deleteError) {
            console.error('Error hard deleting conversation:', deleteError);
            return NextResponse.json({ 
              error: 'Failed to delete conversation', 
              details: deleteError.message 
            }, { status: 500 });
          }
        }

        // Also delete conversation settings
        await supabase
          .from('conversation_settings')
          .delete()
          .eq('user_id', session.user.id)
          .eq('listing_id', listingId)
          .eq('other_participant_id', otherParticipantId);
      }

      return NextResponse.json({ 
        message: 'Conversations deleted successfully',
        deleted_count: conversationIds.length
      });

    } else if (messageIds.length > 0) {
      // Delete individual messages
      if (softDelete) {
        const { data: updatedMessages, error } = await supabase
          .from('messages')
          .update({ is_deleted: true })
          .in('id', messageIds)
          .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .select('id');

        if (error) {
          console.error('Error soft deleting messages:', error);
          return NextResponse.json({ 
            error: 'Failed to delete messages', 
            details: error.message 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          message: 'Messages deleted successfully',
          deleted_count: updatedMessages?.length || 0
        });
      } else {
        // Hard delete individual messages (only sender can delete)
        const { data: deletedMessages, error } = await supabase
          .from('messages')
          .delete()
          .in('id', messageIds)
          .eq('sender_id', session.user.id)
          .select('id');

        if (error) {
          console.error('Error hard deleting messages:', error);
          return NextResponse.json({ 
            error: 'Failed to delete messages', 
            details: error.message 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          message: 'Messages deleted successfully',
          deleted_count: deletedMessages?.length || 0
        });
      }
    } else {
      return NextResponse.json({ error: 'No conversation or message IDs provided' }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete messages API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper function to build threaded message structure
function buildMessageThreads(messages: any[]): any[] {
  // Create a map of message ID to message for quick lookup
  const messageMap = new Map();
  const threadedMessages: any[] = [];

  // First pass: create the map and initialize replies arrays
  messages.forEach(message => {
    messageMap.set(message.id, {
      ...message,
      replies: [],
      reply_count: 0,
      thread_root: !message.parent_message_id,
      has_replies: false,
      depth_level: message.thread_depth || 0
    });
  });

  // Second pass: build the threaded structure
  messages.forEach(message => {
    const messageObj = messageMap.get(message.id);
    
    if (message.parent_message_id) {
      // This is a reply
      const parentMessage = messageMap.get(message.parent_message_id);
      if (parentMessage) {
        parentMessage.replies.push(messageObj);
        parentMessage.reply_count = parentMessage.replies.length;
        parentMessage.has_replies = true;
        
        // Sort replies by thread_order and created_at
        parentMessage.replies.sort((a: any, b: any) => {
          if (a.thread_order !== b.thread_order) {
            return (a.thread_order || 0) - (b.thread_order || 0);
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      }
    } else {
      // This is a root message
      threadedMessages.push(messageObj);
    }
  });

  // Sort root messages by thread_order and created_at
  threadedMessages.sort((a, b) => {
    if (a.thread_order !== b.thread_order) {
      return (a.thread_order || 0) - (b.thread_order || 0);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return threadedMessages;
} 