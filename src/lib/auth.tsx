'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Create a single shared Supabase client instance
const supabase = createClientComponentClient()

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const refreshSession = async () => {
    try {
      console.log('Refreshing auth session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        setUser(null)
        return
      }

      if (session?.user) {
        console.log('Session refreshed successfully:', session.user.email)
        setUser(session.user)
      } else {
        console.log('No session found during refresh')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    let isInitialized = false;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (isInitialized) return; // Prevent duplicate initialization
        
        console.log('Getting initial auth session...')
        isInitialized = true;
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Initial session error:', error)
        }

        if (session?.user) {
          console.log('User signed in:', session.user.email)
          setUser(session.user)
        } else {
          console.log('No initial session found')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        setLoading(false)
        setMounted(true)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      
      // Only refresh router after component is mounted and not during initial load
      if (mounted && event !== 'INITIAL_SESSION') {
        router.refresh()
      }
      
      if (event !== 'INITIAL_SESSION') {
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      console.log('Signing out...')
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      setUser(null)
      console.log('Sign out successful')
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/')
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}

// Export the shared client for use in other components
export { supabase } 