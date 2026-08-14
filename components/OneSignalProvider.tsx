// components/OneSignalProvider.tsx
'use client'

import { useEffect } from 'react'

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🔵 OneSignalProvider MOUNTED')
    
    if (typeof window === 'undefined') {
      console.log('🔵 Not in browser')
      return
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    console.log('🔵 App ID:', appId)
    
    if (!appId) {
      console.log('🔵 No App ID found!')
      return
    }

    if (document.querySelector('script[src*="OneSignalSDK"]')) {
      console.log('🔵 Script already loaded')
      return
    }

    console.log('🔵 Creating script tag...')
    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.async = true
    document.head.appendChild(script)

    console.log('🔵 Setting up OneSignalDeferred...')
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || []
    // @ts-ignore
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      console.log('🔵 OneSignal init called!')
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
          },
        })
        console.log('✅ OneSignal initialized!')
      } catch (error) {
        console.error('❌ OneSignal init error:', error)
      }
    })

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <>{children}</>
}