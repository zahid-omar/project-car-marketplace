import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch reviews for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch reviews for the user
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('user_reviews')
      .select(`
        id,
        rating,
        review_text,
        transaction_type,
        created_at,
        listing_id,
        is_verified,
        reviewer_id
      `)
      .eq('reviewed_user_id', userId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Combine reviews with profile and listing data
    const reviews = []
    if (reviewsData && reviewsData.length > 0) {
      // Get unique reviewer IDs and listing IDs
      const reviewerIds = Array.from(new Set(reviewsData.map(r => r.reviewer_id)))
      const listingIds = Array.from(new Set(reviewsData.filter(r => r.listing_id).map(r => r.listing_id)))

      // Fetch reviewer profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, profile_image_url')
        .in('id', reviewerIds)

      // Fetch listing data if there are any
      let listings: any[] = []
      if (listingIds.length > 0) {
        const { data: listingData } = await supabase
          .from('listings')
          .select('id, title, make, model, year')
          .in('id', listingIds)
        listings = listingData || []
      }

      // Combine the data
      for (const review of reviewsData) {
        const reviewer = profiles?.find(p => p.id === review.reviewer_id)
        const listing = review.listing_id ? listings.find(l => l.id === review.listing_id) : null

        reviews.push({
          ...review,
          reviewer: reviewer || {
            id: review.reviewer_id,
            display_name: null,
            profile_image_url: null
          },
          listing
        })
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewed_user_id', userId)
      .eq('is_hidden', false)

    if (countError) {
      console.error('Error counting reviews:', countError)
    }

    // Fetch user rating summary
    const { data: ratingSummary, error: summaryError } = await supabase
      .from('user_rating_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching rating summary:', summaryError)
    }

    return NextResponse.json({
      reviews: reviews || [],
      ratingSummary: ratingSummary || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new review
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewedUserId, rating, reviewText, transactionType, listingId } = body

    // Validation
    if (!reviewedUserId || !rating) {
      return NextResponse.json({ 
        error: 'Reviewed user ID and rating are required' 
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 })
    }

    if (session.user.id === reviewedUserId) {
      return NextResponse.json({ 
        error: 'Cannot review yourself' 
      }, { status: 400 })
    }

    // Check if user already reviewed this person for this listing
    if (listingId) {
      const { data: existingReview } = await supabase
        .from('user_reviews')
        .select('id')
        .eq('reviewer_id', session.user.id)
        .eq('reviewed_user_id', reviewedUserId)
        .eq('listing_id', listingId)
        .single()

      if (existingReview) {
        return NextResponse.json({ 
          error: 'You have already reviewed this user for this listing' 
        }, { status: 400 })
      }
    }

    // Create the review
    const { data: reviewData, error: insertError } = await supabase
      .from('user_reviews')
      .insert({
        reviewer_id: session.user.id,
        reviewed_user_id: reviewedUserId,
        rating,
        review_text: reviewText,
        transaction_type: transactionType,
        listing_id: listingId
      })
      .select(`
        id,
        rating,
        review_text,
        transaction_type,
        created_at,
        reviewer_id
      `)
      .single()

    if (insertError) {
      console.error('Error creating review:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create review' 
      }, { status: 500 })
    }

    // Fetch reviewer profile
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('id, display_name, profile_image_url')
      .eq('id', session.user.id)
      .single()

    const review = {
      ...reviewData,
      reviewer: reviewerProfile || {
        id: session.user.id,
        display_name: null,
        profile_image_url: null
      }
    }

    return NextResponse.json({ 
      success: true,
      review,
      message: 'Review created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 