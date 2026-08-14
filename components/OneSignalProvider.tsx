// components/OneSignalProvider.tsx
'use client'

import { useEffect } from 'react'

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    if (document.querySelector('script[src*="OneSignalSDK"]')) return

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.async = true
    document.head.appendChild(script)

    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || []
    // @ts-ignore
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true,
        },
      })
    })

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <>{children}</>
}