'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, supabase } from '@/lib/auth'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'
import AppLayout from '@/components/AppLayout'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { refreshSession } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('Attempting login for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Login error:', error)
        setError(error.message)
      } else if (data.user) {
        console.log('Login successful:', data.user.email)
        setMessage('Login successful! Redirecting...')
        
        // Refresh the session to ensure it's properly set
        await refreshSession()
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-md-sys-primary-container rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md-elevation-2">
              <MaterialYouIcon name="user" className="w-10 h-10 text-md-sys-on-primary-container" />
            </div>
            <h1 className="text-md-display-small font-bold text-md-sys-on-surface mb-3">
              Welcome Back
            </h1>
            <p className="text-md-body-large text-md-sys-on-surface-variant">
              Sign in to your Project Car Marketplace account
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-3 border border-md-sys-outline-variant/50 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Alert */}
              {error && (
                <div className="bg-md-sys-error-container border border-md-sys-error/20 rounded-2xl p-4 shadow-md-elevation-1">
                  <div className="flex items-start">
                    <MaterialYouIcon name="exclamation-triangle" className="w-5 h-5 text-md-sys-error mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-md-body-medium text-md-sys-on-error-container">{error}</p>
                  </div>
                </div>
              )}
              
              {/* Success Message */}
              {message && (
                <div className="bg-md-sys-secondary-container border border-md-sys-secondary/20 rounded-2xl p-4 shadow-md-elevation-1">
                  <div className="flex items-start">
                    <MaterialYouIcon name="check-circle" className="w-5 h-5 text-md-sys-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-md-body-medium text-md-sys-on-secondary-container">{message}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-md-body-large font-medium text-md-sys-on-surface mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-md-sys-outline rounded-2xl bg-md-sys-surface text-md-sys-on-surface placeholder-md-sys-on-surface-variant focus:outline-none focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 text-md-body-large shadow-md-elevation-1"
                    placeholder="Enter your email"
                  />
                  <MaterialYouIcon name="envelope" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-md-sys-on-surface-variant" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-md-body-large font-medium text-md-sys-on-surface mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 pr-12 border border-md-sys-outline rounded-2xl bg-md-sys-surface text-md-sys-on-surface placeholder-md-sys-on-surface-variant focus:outline-none focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 text-md-body-large shadow-md-elevation-1"
                    placeholder="Enter your password"
                  />
                  <MaterialYouIcon name="lock-closed" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-md-sys-on-surface-variant" />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-md-sys-on-surface-variant hover:text-md-sys-on-surface transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <MaterialYouIcon name={showPassword ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-md-sys-primary focus:ring-md-sys-primary border-md-sys-outline rounded"
                  />
                  <label htmlFor="remember-me" className="ml-3 text-md-body-medium text-md-sys-on-surface">
                    Remember me
                  </label>
                </div>

                <Link
                  href="/reset-password"
                  className="text-md-body-medium font-medium text-md-sys-primary hover:text-md-sys-primary/80 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-md-sys-primary text-md-sys-on-primary rounded-2xl hover:bg-md-sys-primary/90 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 hover:scale-105 text-md-label-large font-semibold shadow-md-elevation-2 hover:shadow-md-elevation-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <MaterialYouIcon name="arrow-right" className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-md-body-medium text-md-sys-on-surface-variant">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-md-sys-primary hover:text-md-sys-primary/80 transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Back to Home Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-md-body-medium text-md-sys-on-surface-variant hover:text-md-sys-on-surface transition-colors duration-200"
            >
              <MaterialYouIcon name="arrow-left" className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 