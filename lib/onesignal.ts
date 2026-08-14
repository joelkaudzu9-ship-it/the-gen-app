// lib/onesignal.ts
'use client'

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''

// Subscribe user to notifications — tags the current OneSignal subscription
export function subscribeToNotifications(email: string, userId: string) {
  if (typeof window === 'undefined') return

  // @ts-ignore
  window.OneSignalDeferred = window.OneSignalDeferred || []
  // @ts-ignore
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.User.addTags({
      user_id: userId,
      user_email: email,
    })
  })
}

// Unsubscribe from push notifications
export function unsubscribeFromNotifications() {
  if (typeof window === 'undefined') return

  // @ts-ignore
  window.OneSignalDeferred = window.OneSignalDeferred || []
  // @ts-ignore
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.User.PushSubscription.optOut()
  })
}

// Send notification via our API route
export async function sendPushNotification(title: string, message: string, data?: any) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        data,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending push notification:', error)
    return null
  }
}