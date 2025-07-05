import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const notificationPreferencesSchema = z.object({
  in_app_new_messages: z.boolean().default(true),
  in_app_replies: z.boolean().default(true),
  in_app_mentions: z.boolean().default(true),
  email_new_messages: z.boolean().default(true),
  email_replies: z.boolean().default(true),
  email_mentions: z.boolean().default(true),
  email_daily_digest: z.boolean().default(false),
  push_new_messages: z.boolean().default(false),
  push_replies: z.boolean().default(false),
  push_mentions: z.boolean().default(false),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional()
});

// GET /api/profile/notification-preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // If no preferences exist, create default preferences
    if (!preferences) {
      const defaultPreferences = {
        user_id: session.user.id,
        in_app_new_messages: true,
        in_app_replies: true,
        in_app_mentions: true,
        email_new_messages: true,
        email_replies: true,
        email_mentions: true,
        email_daily_digest: false,
        push_new_messages: false,
        push_replies: false,
        push_mentions: false,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null
      };

      const { data: createdPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (createError) {
        console.error('Error creating default preferences:', createError);
        return NextResponse.json({ error: 'Failed to create default preferences' }, { status: 500 });
      }

      return NextResponse.json({ preferences: createdPreferences });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile/notification-preferences - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    // Validate quiet hours format if provided
    if (validatedData.quiet_hours_enabled) {
      if (!validatedData.quiet_hours_start || !validatedData.quiet_hours_end) {
        return NextResponse.json(
          { error: 'Quiet hours start and end times are required when quiet hours are enabled' },
          { status: 400 }
        );
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(validatedData.quiet_hours_start) || !timeRegex.test(validatedData.quiet_hours_end)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:MM format (e.g., 22:00)' },
          { status: 400 }
        );
      }
    }

    // First try to update existing preferences
    const { data: existingPreferences } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    let preferences;
    let error;

    if (existingPreferences) {
      // Update existing preferences
      const { data: updatedPreferences, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...validatedData,
          quiet_hours_start: validatedData.quiet_hours_enabled ? validatedData.quiet_hours_start : null,
          quiet_hours_end: validatedData.quiet_hours_enabled ? validatedData.quiet_hours_end : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single();

      preferences = updatedPreferences;
      error = updateError;
    } else {
      // Insert new preferences
      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: session.user.id,
          ...validatedData,
          quiet_hours_start: validatedData.quiet_hours_enabled ? validatedData.quiet_hours_start : null,
          quiet_hours_end: validatedData.quiet_hours_enabled ? validatedData.quiet_hours_end : null
        })
        .select()
        .single();

      preferences = newPreferences;
      error = insertError;
    }

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Notification preferences PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile/notification-preferences - Create default preferences for a user
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if preferences already exist
    const { data: existingPreferences } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (existingPreferences) {
      return NextResponse.json({ 
        error: 'Notification preferences already exist for this user' 
      }, { status: 409 });
    }

    // Create default preferences
    const defaultPreferences = {
      user_id: session.user.id,
      in_app_new_messages: true,
      in_app_replies: true,
      in_app_mentions: true,
      email_new_messages: true,
      email_replies: true,
      email_mentions: true,
      email_daily_digest: false,
      push_new_messages: false,
      push_replies: false,
      push_mentions: false,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null
    };

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .insert(defaultPreferences)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      preferences,
      message: 'Default notification preferences created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Notification preferences POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 