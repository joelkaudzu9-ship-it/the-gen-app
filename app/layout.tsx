// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'
import { OneSignalProvider } from '@/components/OneSignalProvider'  // ← ADD THIS
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'THE GEN-APP - Generation Family Retreat 2026',
  description: 'Official app for Generation Family Retreat',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <OneSignalProvider>  {/* ← ADD THIS WRAPPER */}
          <ClientLayout>
            <div className="max-w-md mx-auto min-h-screen">
              {children}
            </div>
          </ClientLayout>
        </OneSignalProvider>  {/* ← CLOSE THE WRAPPER */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#0A0A0A',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            },
          }}
        />
      </body>
    </html>
  )
}