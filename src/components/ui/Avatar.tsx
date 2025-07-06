import Image from 'next/image'
import { User } from '@supabase/supabase-js'

interface AvatarProps {
  user?: User | null
  profileImageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showLetterFallback?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg'
}

export default function Avatar({ 
  user, 
  profileImageUrl, 
  size = 'md', 
  className = '',
  showLetterFallback = true
}: AvatarProps) {
  const sizeClass = sizeClasses[size]
  
  // Get display name or email for fallback
  const displayName = user?.user_metadata?.display_name || user?.email
  const firstLetter = displayName?.charAt(0).toUpperCase() || '?'

  if (profileImageUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden ${className}`}>
        <Image
          src={profileImageUrl}
          alt={`${displayName || 'User'}'s profile picture`}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          className="w-full h-full object-cover"
          unoptimized={false}
        />
      </div>
    )
  }

  if (showLetterFallback && user) {
    return (
      <div className={`${sizeClass} bg-md-sys-primary rounded-full flex items-center justify-center text-md-sys-on-primary font-medium ${className}`}>
        {firstLetter}
      </div>
    )
  }

  // No fallback, return empty div
  return <div className={`${sizeClass} rounded-full ${className}`} />
} 