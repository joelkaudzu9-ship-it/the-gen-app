// components/PushProvider.tsx
'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { registerPushToken } from '@/lib/push'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function PushProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (Capacitor.isNativePlatform()) return // native app uses its own registration instead

    const initWebPush = async () => {
      try {
        const supported = await isSupported()
        if (!supported) return

        if (!firebaseConfig.apiKey) {
          console.error('Firebase web config is missing — check env vars')
          return
        }

        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
        const messaging = getMessaging(app)

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (token) {
          console.log('Web push token:', token)
          await registerPushToken(token, 'web')
        }
      } catch (error) {
        console.error('Web push setup failed:', error)
      }
    }

    initWebPush()
  }, [])

  return <>{children}</>
}