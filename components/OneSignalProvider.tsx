// components/OneSignalProvider.tsx
'use client'

import { useEffect } from 'react'
import { initOneSignal } from '@/lib/onesignal'

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in production, not during development
    if (process.env.NODE_ENV === 'development') return
    initOneSignal()
  }, [])

  return <>{children}</>
}