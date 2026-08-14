// lib/onesignal.ts
'use client'

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''

// TEMPORARILY DISABLED - Fixing v16 SDK compatibility
export function initOneSignal() {
  if (typeof window === 'undefined') return
  // 🔴 TEMPORARILY DISABLED — v16 SDK incompatibility being fixed
  console.log('OneSignal initialization temporarily disabled')
  return

  // Original code below (commented out for now)
  /*
  // @ts-ignore
  if (window.OneSignal) return

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
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: true,
        notifyButton: {
          enable: true,
        },
      })
    })
  }
  */
}

// Temporarily disabled
export function subscribeToNotifications(email: string, userId: string) {
  console.log('Notification subscription disabled')
  return
}

// Temporarily disabled
export function unsubscribeFromNotifications() {
  console.log('Notification unsubscription disabled')
  return
}

// Temporarily disabled
export async function sendPushNotification(title: string, message: string, data?: any) {
  console.log('Push notification disabled')
  return { success: false, message: 'Disabled' }
}