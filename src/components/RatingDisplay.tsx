'use client'

import { useState, useEffect } from 'react'
import { MaterialYouIcon } from './ui/MaterialYouIcon'

interface RatingDisplayProps {
  userId: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface RatingSummary {
  total_reviews: number
  average_rating: number
}

export default function RatingDisplay({ 
  userId, 
  showCount = true, 
  size = 'md', 
  className = '' 
}: RatingDisplayProps) {
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRatingSummary()
  }, [userId])

  const fetchRatingSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?userId=${userId}&limit=1`)
      
      if (response.ok) {
        const data = await response.json()
        setRatingSummary(data.ratingSummary)
      }
    } catch (error) {
      console.error('Error fetching rating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate comprehensive rating description for screen readers
  const generateRatingDescription = () => {
    if (!ratingSummary || ratingSummary.total_reviews === 0) {
      return 'No reviews available'
    }

    const rating = ratingSummary.average_rating.toFixed(1)
    const reviewCount = ratingSummary.total_reviews
    const reviewText = reviewCount === 1 ? 'review' : 'reviews'
    
    return `Average rating: ${rating} out of 5 stars, based on ${reviewCount} ${reviewText}`
  }

  // Generate star-by-star description for screen readers
  const generateStarDescription = () => {
    if (!ratingSummary || ratingSummary.total_reviews === 0) {
      return 'No rating available'
    }

    const rating = Math.round(ratingSummary.average_rating)
    const filledStars = rating
    const emptyStars = 5 - rating
    
    const parts = []
    if (filledStars > 0) {
      parts.push(`${filledStars} filled star${filledStars !== 1 ? 's' : ''}`)
    }
    if (emptyStars > 0) {
      parts.push(`${emptyStars} empty star${emptyStars !== 1 ? 's' : ''}`)
    }
    
    return parts.join(', ')
  }

  // Get Material You icon size based on component size
  const getMaterialYouIconSize = () => {
    switch (size) {
      case 'sm': return 'xs'
      case 'md': return 'sm'
      case 'lg': return 'md'
      default: return 'sm'
    }
  }

  if (loading) {
    return (
      <div 
        className={`flex items-center space-x-1 ${className}`}
        role="status"
        aria-label="Loading rating information"
      >
        <div 
          className="animate-pulse bg-surface-container rounded w-16 h-4"
          aria-hidden={true}
        />
        <span className="sr-only">Loading rating data...</span>
      </div>
    )
  }

  if (!ratingSummary || ratingSummary.total_reviews === 0) {
    return (
      <div 
        className={`flex items-center space-x-1 text-on-surface-variant ${className}`}
        role="img"
                aria-label="No reviews available"
      >
        <MaterialYouIcon
          name="star-outline"
          size={getMaterialYouIconSize()}
          className="text-on-surface-variant/60"
          aria-hidden={true}
                  />
          <span className={`${getTextSize(size)}`} aria-hidden={true}>
          No reviews
        </span>
      </div>
    )
  }

  const renderStars = () => {
    const rating = Math.round(ratingSummary.average_rating)
    return (
      <div 
        className="flex items-center gap-0.5"
        role="img"
        aria-label={generateStarDescription()}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating
          return (
            <MaterialYouIcon
              key={star}
              name={isFilled ? "star" : "star-outline"}
              size={getMaterialYouIconSize()}
              className={isFilled ? 'text-yellow-500' : 'text-on-surface-variant/40'}
              aria-hidden={true}
              aria-label={isFilled ? `Star ${star}: Filled` : `Star ${star}: Empty`}
            />
          )
        })}
      </div>
    )
  }

  const ratingValue = ratingSummary.average_rating.toFixed(1)
  const reviewCount = ratingSummary.total_reviews
  const reviewText = reviewCount === 1 ? 'review' : 'reviews'

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      role="group"
      aria-label={generateRatingDescription()}
    >
      {/* Star Rating Visual */}
      {renderStars()}
      
      {/* Rating Information */}
      <div 
        className={`flex items-center space-x-1 ${getTextSize(size)}`}
        role="group"
        aria-label="Rating details"
      >
        <span 
          className="font-medium text-on-surface"
          role="text"
          aria-label={`Rating: ${ratingValue} out of 5`}
        >
          {ratingValue}
        </span>
        {showCount && (
          <span 
            className="text-on-surface-variant"
            role="text"
            aria-label={`Based on ${reviewCount} ${reviewText}`}
          >
            ({reviewCount} {reviewText})
          </span>
        )}
      </div>

      {/* Hidden comprehensive description for screen readers */}
      <span className="sr-only">
        {generateRatingDescription()}
      </span>
    </div>
  )
}

function getTextSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-label-small'
    case 'md':
      return 'text-body-medium'
    case 'lg':
      return 'text-body-large'
    default:
      return 'text-body-medium'
  }
} 