// components/ClientLayout.tsx
'use client'

import { BottomNav } from '@/components/ui/BottomNav'
import { OneSignalProvider } from '@/components/OneSignalProvider'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OneSignalProvider>
        {children}
      </OneSignalProvider>
      <BottomNav />
    </>
  )
}