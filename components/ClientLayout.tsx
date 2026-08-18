// components/ClientLayout.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { registerPushToken } from '@/lib/push'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '@/components/ui/BottomNav'
import { UpdateBanner } from '@/components/UpdateBanner'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pendingTokenRef = useRef<string | null>(null)

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

    // Re-attempt saving the token whenever auth state changes (login,
    // token refresh, etc.) — covers the case where the push token
    // arrived before Supabase's session was ready.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && pendingTokenRef.current) {
        console.log('🔔 Auth ready, retrying token save:', pendingTokenRef.current)
        registerPushToken(pendingTokenRef.current, 'android')
      }
    })

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

        PushNotifications.addListener('registration', async (token) => {
          console.log('🔔 FCM token generated:', token.value)
          pendingTokenRef.current = token.value

          // Try immediately in case a session already exists.
          const { data: { user } } = await supabase.auth.getUser()
          console.log('🔔 Current user at registration time:', user?.id || 'none')
          if (user) {
            await registerPushToken(token.value, 'android')
            console.log('🔔 Token saved immediately')
          } else {
            console.log('🔔 No user yet, will retry after login')
          }
        })

        PushNotifications.addListener('registrationError', (error) => {
          console.error('🔔 Push registration error:', error)
        })

        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('🔔 Push received in foreground:', notification)
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || 'THE GEN-APP',
                  body: notification.body || '',
                  id: Math.floor(Math.random() * 2147483647), // valid 32-bit int
                  schedule: { at: new Date(Date.now() + 100) },
                },
              ],
            })
          } catch (error) {
            console.error('Failed to show local notification:', error)
          }
        })

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('🔔 Push tapped:', action)
        })
      } catch (error) {
        console.error('Push notification setup failed:', error)
      }
    }
    initNativePush()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      <UpdateBanner />
      {children}
      <BottomNav />
    </>
  )
}