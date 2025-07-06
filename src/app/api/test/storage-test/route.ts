import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Storage Test ===')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    const results = {
      authenticated: !!session && !authError,
      userId: session?.user?.id || null,
      authError: authError?.message || null,
      storage: {
        bucketsAccessible: false,
        buckets: [],
        policyTest: null
      }
    }

    if (session && !authError) {
      // Test storage bucket access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      results.storage.bucketsAccessible = !bucketsError
      results.storage.buckets = buckets?.map(b => b.name) || []
      
      if (bucketsError) {
        console.error('Error accessing buckets:', bucketsError)
      }

      // Test if we can list objects in user-uploads bucket
      const { data: objects, error: objectsError } = await supabase.storage
        .from('user-uploads')
        .list(`${session.user.id}/avatars`, { limit: 1 })
      
      results.storage.policyTest = {
        canListUserFolder: !objectsError,
        error: objectsError?.message || null
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 