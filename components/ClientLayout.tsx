// components/ClientLayout.tsx
'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { PushNotifications } from '@capacitor/push-notifications'
import { registerPushToken } from '@/lib/push'
import { BottomNav } from '@/components/ui/BottomNav'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initApp = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide()
        }
      } catch (error) {
        console.log('SplashScreen not available:', error)
      }
    }
    initApp()

    const initNativePush = async () => {
      if (!Capacitor.isNativePlatform()) return

      try {
        const permStatus = await PushNotifications.checkPermissions()

        if (permStatus.receive === 'prompt') {
          const requested = await PushNotifications.requestPermissions()
          if (requested.receive !== 'granted') return
        } else if (permStatus.receive !== 'granted') {
          return
        }

        await PushNotifications.register()

        PushNotifications.addListener('registration', (token) => {
          console.log('FCM token:', token.value)
          registerPushToken(token.value, 'android')
        })

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error)
        })
      } catch (error) {
        console.error('Push notification setup failed:', error)
      }
    }
    initNativePush()
  }, [])

  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}