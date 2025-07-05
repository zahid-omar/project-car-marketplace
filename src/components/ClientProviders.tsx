'use client'

import { AuthProvider } from '@/lib/auth'
import { MaterialYouThemeProvider } from '@/lib/material-you-theme'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MaterialYouThemeProvider>
      <AuthProvider>
        <div id="root" className="min-h-screen bg-md-sys-surface text-md-sys-on-surface">
          {children}
        </div>
      </AuthProvider>
    </MaterialYouThemeProvider>
  )
} 