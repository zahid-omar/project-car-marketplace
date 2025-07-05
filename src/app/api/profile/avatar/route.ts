import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST: Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload image' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to cleanup uploaded file
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
      
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      imageUrl: publicUrl,
      message: 'Profile picture updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE: Remove profile picture
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get current profile to find existing image URL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile' 
      }, { status: 500 })
    }

    // Extract file path from URL if exists
    let filePath = null
    if (profile.profile_image_url) {
      const url = new URL(profile.profile_image_url)
      filePath = url.pathname.split('/').slice(-2).join('/') // Get 'avatars/filename'
    }

    // Update profile to remove image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: null })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    // Try to delete file from storage (don't fail if this doesn't work)
    if (filePath) {
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture removed successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 