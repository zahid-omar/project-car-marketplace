import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'Project Car Marketplace',
  description: 'Buy and sell modified and project cars with fellow automotive enthusiasts',
  keywords: 'project cars, modified cars, automotive marketplace, car enthusiasts, custom builds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} min-h-screen`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
} 