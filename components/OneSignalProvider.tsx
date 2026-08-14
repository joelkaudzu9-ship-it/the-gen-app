// components/OneSignalProvider.tsx
'use client'

import { useEffect } from 'react'

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    // Check if OneSignal is already loaded
    if (document.querySelector('script[src*="OneSignalSDK"]')) return

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      // @ts-ignore
      window.OneSignal = window.OneSignal || []
      // @ts-ignore
      window.OneSignal.push(() => {
        // @ts-ignore
        window.OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          autoRegister: true,
        })
      })
    }

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <>{children}</>
}