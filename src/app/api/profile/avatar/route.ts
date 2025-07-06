import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST: Upload profile picture
export async function POST(request: NextRequest) {
  try {
    console.log('=== Profile Avatar Upload Debug ===')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    console.log('Checking authentication...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error: ' + authError.message }, { status: 401 })
    }
    
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 })
    }

    console.log('User authenticated:', session.user.id)
    const userId = session.user.id
    
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size)
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/avatars/${fileName}`

    console.log('Generated file path:', filePath)

    // Convert file to buffer
    console.log('Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Buffer size:', buffer.length)

    // Test storage access
    console.log('Testing storage bucket access...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
    } else {
      console.log('Available buckets:', buckets?.map(b => b.name))
    }

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError
      })
      return NextResponse.json({ 
        error: 'Failed to upload image: ' + uploadError.message 
      }, { status: 500 })
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    console.log('Getting public URL...')
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    // Update user profile with new image URL
    console.log('Updating user profile...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to cleanup uploaded file
      console.log('Cleaning up uploaded file...')
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
      
      return NextResponse.json({ 
        error: 'Failed to update profile: ' + updateError.message 
      }, { status: 500 })
    }

    console.log('Profile updated successfully')

    return NextResponse.json({ 
      success: true,
      imageUrl: publicUrl,
      message: 'Profile picture updated successfully'
    })

  } catch (error) {
    console.error('Unexpected API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}

// DELETE: Remove profile picture
export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Profile Avatar Delete Debug ===')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    console.log('Checking authentication...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Authentication failed:', authError || 'No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', session.user.id)
    const userId = session.user.id

    // Get current profile to find existing image URL
    console.log('Fetching current profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch profile' 
      }, { status: 500 })
    }

    console.log('Current profile image URL:', profile.profile_image_url)

    // Extract file path from URL if exists
    let filePath = null
    if (profile.profile_image_url) {
      const url = new URL(profile.profile_image_url)
      const pathParts = url.pathname.split('/')
      console.log('URL path parts:', pathParts)
      // Get 'userId/avatars/filename' - skip the first empty part and 'storage/v1/object/public/user-uploads/'
      const relevantParts = pathParts.slice(-3) // Get last 3 parts: userId/avatars/filename
      filePath = relevantParts.join('/')
      console.log('Extracted file path:', filePath)
    }

    // Update profile to remove image URL
    console.log('Updating profile to remove image URL...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: null })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    console.log('Profile updated successfully')

    // Try to delete file from storage (don't fail if this doesn't work)
    if (filePath) {
      console.log('Deleting file from storage:', filePath)
      const { error: deleteError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath])
      
      if (deleteError) {
        console.error('Warning: Failed to delete file from storage:', deleteError)
      } else {
        console.log('File deleted from storage successfully')
      }
    } else {
      console.log('No file path to delete')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture removed successfully'
    })

  } catch (error) {
    console.error('Unexpected API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
} 