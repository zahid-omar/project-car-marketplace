'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import Image from 'next/image'
import { StarIcon, UserIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon, FlagIcon } from '@heroicons/react/24/outline'

interface Review {
  id: string
  rating: number
  review_text: string | null
  transaction_type: string | null
  created_at: string
  listing_id: string | null
  is_verified: boolean
  reviewer: {
    id: string
    display_name: string | null
    profile_image_url: string | null
  }
  listing?: {
    id: string
    title: string
    make: string
    model: string
    year: number
  }
}

interface RatingSummary {
  total_reviews: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

interface UserReviewsProps {
  userId: string
  canReview?: boolean
  className?: string
}

export default function UserReviews({ userId, canReview = false, className = '' }: UserReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Review form state
  const [newReview, setNewReview] = useState({
    rating: 0,
    reviewText: '',
    transactionType: 'general'
  })

  useEffect(() => {
    fetchReviews()
  }, [userId, page])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/reviews?userId=${userId}&page=${page}&limit=10`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews)
      setRatingSummary(data.ratingSummary)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newReview.rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewedUserId: userId,
          rating: newReview.rating,
          reviewText: newReview.reviewText.trim() || null,
          transactionType: newReview.transactionType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      // Reset form and refresh reviews
      setNewReview({ rating: 0, reviewText: '', transactionType: 'general' })
      setShowReviewForm(false)
      setPage(1)
      await fetchReviews()
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false, size = 'w-5 h-5', ariaLabel?: string) => {
    const baseDescription = interactive 
      ? `Interactive star rating. Current rating: ${rating} out of 5 stars.`
      : `Rating: ${rating} out of 5 stars.`
    
    return (
      <div 
        className="flex items-center space-x-1"
        role={interactive ? "radiogroup" : "img"}
        aria-label={ariaLabel || baseDescription}
        aria-describedby={interactive ? `rating-help-${rating}` : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating
          const StarComponent = filled ? StarIcon : StarOutlineIcon
          
          return interactive ? (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === rating}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              onClick={() => setNewReview({ ...newReview, rating: star })}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  const nextRating = Math.min(5, star + 1)
                  setNewReview({ ...newReview, rating: nextRating })
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  const prevRating = Math.max(1, star - 1)
                  setNewReview({ ...newReview, rating: prevRating })
                }
              }}
              className={`${size} ${
                filled ? 'text-yellow-400' : 'text-gray-300'
              } cursor-pointer hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200`}
            >
              <StarComponent />
            </button>
          ) : (
            <span
              key={star}
              className={`${size} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
              aria-hidden="true"
            >
              <StarComponent />
            </span>
          )
        })}
        {interactive && (
          <div id={`rating-help-${rating}`} className="sr-only">
            Use arrow keys to navigate between ratings. Press Enter or Space to select.
          </div>
        )}
        {!interactive && (
          <span className="sr-only">{baseDescription}</span>
        )}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    if (!ratingSummary || ratingSummary.total_reviews === 0) return null

    const ratingData = [
      { stars: 5, count: ratingSummary.five_star },
      { stars: 4, count: ratingSummary.four_star },
      { stars: 3, count: ratingSummary.three_star },
      { stars: 2, count: ratingSummary.two_star },
      { stars: 1, count: ratingSummary.one_star },
    ]

    return (
      <div className="space-y-2" role="list" aria-label="Rating distribution breakdown">
        {ratingData.map(({ stars, count }) => {
          const percentage = ratingSummary.total_reviews > 0 
            ? (count / ratingSummary.total_reviews) * 100 
            : 0

          return (
            <div 
              key={stars} 
              className="flex items-center space-x-2 text-sm" 
              role="listitem"
              aria-label={`${stars} star rating: ${count} reviews (${percentage.toFixed(1)}%)`}
            >
              <span className="w-6 text-on-surface" aria-hidden="true">{stars}</span>
              <StarIcon className="w-4 h-4 text-yellow-400" aria-hidden="true" />
              <div 
                className="flex-1 bg-surface-container-high rounded-full h-2" 
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${percentage.toFixed(1)}% of reviews`}
              >
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-on-surface-variant" aria-hidden="true">{count}</span>
              <span className="sr-only">
                {stars} star rating has {count} review{count !== 1 ? 's' : ''}, representing {percentage.toFixed(1)}% of all reviews
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section className={`space-y-6 ${className}`} aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="sr-only">User Reviews and Ratings</h2>
      
      {/* Rating Summary */}
      {ratingSummary && ratingSummary.total_reviews > 0 && (
        <article className="bg-surface-container rounded-xl elevation-1 p-6" aria-labelledby="rating-summary-heading">
          <h3 id="rating-summary-heading" className="text-headline-small font-medium text-on-surface mb-4">Reviews & Ratings</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center" role="region" aria-labelledby="overall-rating-heading">
              <h4 id="overall-rating-heading" className="sr-only">Overall Rating Summary</h4>
              <div className="text-display-medium font-bold text-on-surface" aria-describedby="rating-context">
                {ratingSummary.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center my-2">
                {renderStars(Math.round(ratingSummary.average_rating), false, 'w-6 h-6', `Overall rating: ${ratingSummary.average_rating.toFixed(1)} out of 5 stars`)}
              </div>
              <div id="rating-context" className="text-body-medium text-on-surface-variant">
                Based on {ratingSummary.total_reviews} review{ratingSummary.total_reviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Rating Distribution */}
            <div role="region" aria-labelledby="rating-distribution-heading">
              <h4 id="rating-distribution-heading" className="sr-only">Rating Distribution</h4>
              {renderRatingDistribution()}
            </div>
          </div>
        </article>
      )}

      {/* Review Form */}
      {canReview && user && user.id !== userId && (
        <section className="bg-surface-container rounded-xl elevation-1 p-6" aria-labelledby="review-form-heading">
          <h3 id="review-form-heading" className="sr-only">Write a Review</h3>
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full px-6 py-3 border border-primary text-primary rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary text-label-large font-medium"
              aria-describedby="write-review-desc"
            >
              Write a Review
            </button>
          ) : (
            <form onSubmit={submitReview} className="space-y-4" noValidate>
              <div 
                id="review-form-status" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
              >
                {submitting ? 'Submitting review...' : error ? `Error: ${error}` : 'Review form ready'}
              </div>
              
              <h4 className="text-title-large font-medium text-on-surface">Write a Review</h4>
              
              {/* Rating */}
              <fieldset>
                <legend className="block text-body-medium font-medium text-on-surface mb-2">
                  Rating *
                </legend>
                <div aria-describedby="rating-description">
                  {renderStars(newReview.rating, true, 'w-8 h-8', 'Select your rating')}
                </div>
                <div id="rating-description" className="text-body-small text-on-surface-variant mt-1">
                  Required: Choose a rating from 1 to 5 stars
                </div>
                {newReview.rating === 0 && error && (
                  <div role="alert" className="text-error text-body-small mt-1">
                    Please select a rating before submitting
                  </div>
                )}
              </fieldset>

              {/* Transaction Type */}
              <div>
                <label htmlFor="transactionType" className="block text-body-medium font-medium text-on-surface mb-2">
                  Transaction Type
                </label>
                <select
                  id="transactionType"
                  value={newReview.transactionType}
                  onChange={(e) => setNewReview({ ...newReview, transactionType: e.target.value })}
                  className="w-full border border-outline rounded-xl px-4 py-3 bg-surface text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-medium"
                  aria-describedby="transaction-type-desc"
                >
                  <option value="general">General</option>
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                </select>
                <div id="transaction-type-desc" className="text-body-small text-on-surface-variant mt-1">
                  Select the type of interaction you had with this user
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label htmlFor="reviewText" className="block text-body-medium font-medium text-on-surface mb-2">
                  Review (Optional)
                </label>
                <textarea
                  id="reviewText"
                  rows={4}
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                  className="w-full border border-outline rounded-xl px-4 py-3 bg-surface text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-medium resize-vertical"
                  placeholder="Share your experience..."
                  aria-describedby="review-text-desc"
                  maxLength={1000}
                />
                <div id="review-text-desc" className="text-body-small text-on-surface-variant mt-1">
                  Optional: Share details about your experience (max 1000 characters)
                </div>
                <div className="text-body-small text-on-surface-variant mt-1" aria-live="polite">
                  {newReview.reviewText.length}/1000 characters
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div 
                  role="alert" 
                  className="bg-error-container text-on-error-container p-3 rounded-xl text-body-medium"
                  aria-describedby="error-description"
                >
                  <div className="font-medium">Error</div>
                  <div id="error-description">{error}</div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting || newReview.rating === 0}
                  className="px-6 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed text-label-large font-medium"
                  aria-describedby="submit-button-desc"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false)
                    setNewReview({ rating: 0, reviewText: '', transactionType: 'general' })
                    setError(null)
                  }}
                  className="px-6 py-3 border border-outline text-on-surface rounded-xl hover:bg-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary text-label-large font-medium"
                >
                  Cancel
                </button>
              </div>
              <div id="submit-button-desc" className="sr-only">
                {newReview.rating === 0 ? 'Please select a rating before submitting' : 'Submit your review'}
              </div>
            </form>
          )}
          <div id="write-review-desc" className="sr-only">
            Click to open the review form and share your experience with this user
          </div>
        </section>
      )}

      {/* Reviews List */}
      <section className="bg-surface-container rounded-xl elevation-1" aria-labelledby="reviews-list-heading">
        <header className="px-6 py-4 border-b border-outline-variant">
          <h3 id="reviews-list-heading" className="text-headline-small font-medium text-on-surface">
            Reviews ({ratingSummary?.total_reviews || 0})
          </h3>
        </header>

        {loading ? (
          <div className="p-6 text-center" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" aria-hidden="true"></div>
            <span className="sr-only">Loading reviews...</span>
            <div className="text-body-medium text-on-surface-variant mt-2">Loading reviews...</div>
          </div>
        ) : error ? (
          <div className="p-6 text-center" role="alert">
            <div className="text-error text-body-medium">{error}</div>
            <button 
              onClick={fetchReviews}
              className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-label-medium font-medium"
            >
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-body-large text-on-surface-variant">
              No reviews yet. Be the first to leave a review!
            </div>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant" role="list" aria-label="User reviews">
            {reviews.map((review) => (
              <article key={review.id} className="p-6" role="listitem" aria-labelledby={`review-${review.id}-heading`}>
                <div className="flex items-start space-x-4">
                  {/* Reviewer Avatar */}
                  <div className="flex-shrink-0">
                    {review.reviewer.profile_image_url ? (
                      <Image
                        src={review.reviewer.profile_image_url}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center" aria-hidden="true">
                        <UserIcon className="w-6 h-6 text-on-surface-variant" />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <header className="flex items-start justify-between">
                      <div>
                        <h4 id={`review-${review.id}-heading`} className="text-body-medium font-medium text-on-surface">
                          {review.reviewer.display_name || 'Anonymous User'}
                          {review.is_verified && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-label-small font-medium bg-secondary-container text-on-secondary-container">
                              <span aria-hidden="true">✓</span>
                              <span className="ml-1">Verified</span>
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center flex-wrap gap-3 mt-2">
                          {renderStars(review.rating, false, 'w-4 h-4', `${review.reviewer.display_name || 'User'} rated ${review.rating} out of 5 stars`)}
                          <time 
                            className="text-body-small text-on-surface-variant"
                            dateTime={review.created_at}
                          >
                            {formatDate(review.created_at)}
                          </time>
                          {review.transaction_type && (
                            <span className="text-label-small px-2 py-1 bg-surface-container-high text-on-surface rounded-lg">
                              {review.transaction_type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Report Button */}
                      {user && user.id !== review.reviewer.id && (
                        <button 
                          className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
                          aria-label="Report this review"
                          title="Report inappropriate content"
                        >
                          <FlagIcon className="w-4 h-4" />
                        </button>
                      )}
                    </header>

                    {/* Review Text */}
                    {review.review_text && (
                      <div className="mt-3">
                        <p className="text-body-medium text-on-surface leading-relaxed">{review.review_text}</p>
                      </div>
                    )}

                    {/* Associated Listing */}
                    {review.listing && (
                      <div className="mt-3 p-3 bg-surface-container-low rounded-lg">
                        <span className="text-body-small text-on-surface-variant">Related to: </span>
                        <span className="text-body-small font-medium text-on-surface">
                          {review.listing.year} {review.listing.make} {review.listing.model}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <footer className="px-6 py-4 border-t border-outline-variant">
            <nav 
              className="flex justify-center" 
              role="navigation" 
              aria-label="Reviews pagination"
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-outline text-on-surface rounded-lg text-label-medium font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <div 
                  className="px-4 py-2 text-body-medium text-on-surface-variant"
                  role="status"
                  aria-live="polite"
                  aria-label={`Currently on page ${page} of ${totalPages}`}
                >
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-outline text-on-surface rounded-lg text-label-medium font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            </nav>
          </footer>
        )}
      </section>
    </section>
  )
} 