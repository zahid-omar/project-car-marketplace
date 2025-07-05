import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const createReportSchema = z.object({
  message_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'scam', 'offensive', 'other']),
  description: z.string().optional()
});

const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
  resolution_notes: z.string().optional()
});

// GET /api/reports - Get reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/moderator role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const reason = url.searchParams.get('reason');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('message_reports')
      .select(`
        *,
        message:messages(
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, email),
          recipient:profiles!messages_recipient_id_fkey(id, display_name, email),
          listing:listings(id, title, make, model, year, price)
        ),
        reporter:profiles!message_reports_reporter_id_fkey(id, display_name, email),
        reported_user:profiles!message_reports_reported_user_id_fkey(id, display_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (reason) {
      query = query.eq('reason', reason);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Verify the message exists and get the sender
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, listing_id')
      .eq('id', validatedData.message_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Prevent users from reporting their own messages
    if (message.sender_id === session.user.id) {
      return NextResponse.json({ error: 'Cannot report your own message' }, { status: 400 });
    }

    // Check if user is involved in the conversation
    if (message.sender_id !== session.user.id && message.recipient_id !== session.user.id) {
      return NextResponse.json({ error: 'Can only report messages in your conversations' }, { status: 403 });
    }

    // Check if user has already reported this message
    const { data: existingReport, error: existingError } = await supabase
      .from('message_reports')
      .select('id')
      .eq('message_id', validatedData.message_id)
      .eq('reporter_id', session.user.id)
      .single();

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this message' }, { status: 400 });
    }

    // Create the report
    const { data: report, error } = await supabase
      .from('message_reports')
      .insert({
        message_id: validatedData.message_id,
        reporter_id: session.user.id,
        reported_user_id: message.sender_id,
        reason: validatedData.reason,
        description: validatedData.description,
        status: 'pending'
      })
      .select(`
        *,
        message:messages(
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, email),
          recipient:profiles!messages_recipient_id_fkey(id, display_name, email),
          listing:listings(id, title, make, model, year, price)
        ),
        reporter:profiles!message_reports_reporter_id_fkey(id, display_name, email),
        reported_user:profiles!message_reports_reported_user_id_fkey(id, display_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Flag the message for review
    await supabase
      .from('messages')
      .update({
        is_flagged: true,
        flagged_at: new Date().toISOString(),
        flagged_by: session.user.id,
        flag_reason: validatedData.reason,
        moderation_status: 'pending'
      })
      .eq('id', validatedData.message_id);

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Create report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/reports - Update report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/moderator role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const reportId = url.searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    // Update the report
    const { data: report, error } = await supabase
      .from('message_reports')
      .update({
        status: validatedData.status,
        resolution_notes: validatedData.resolution_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id
      })
      .eq('id', reportId)
      .select(`
        *,
        message:messages(
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, email),
          recipient:profiles!messages_recipient_id_fkey(id, display_name, email),
          listing:listings(id, title, make, model, year, price)
        ),
        reporter:profiles!message_reports_reporter_id_fkey(id, display_name, email),
        reported_user:profiles!message_reports_reported_user_id_fkey(id, display_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating report:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    // Update message moderation status based on report resolution
    if (report) {
      let moderationStatus: string;
      switch (validatedData.status) {
        case 'resolved':
          moderationStatus = 'hidden'; // Hide the message
          break;
        case 'dismissed':
          moderationStatus = 'approved'; // Keep the message visible
          break;
        default:
          moderationStatus = 'pending';
      }

      await supabase
        .from('messages')
        .update({
          moderation_status: moderationStatus,
          moderated_at: new Date().toISOString(),
          moderated_by: session.user.id
        })
        .eq('id', report.message_id);
    }

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    console.error('Update report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 