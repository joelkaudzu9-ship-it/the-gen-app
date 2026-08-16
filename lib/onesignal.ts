// lib/onesignal.ts
'use client'

import { Capacitor } from '@capacitor/core'
import OneSignal from 'onesignal-cordova-plugin'

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''

export function subscribeToNotifications(email: string, userId: string) {
  if (typeof window === 'undefined') return

  if (Capacitor.isNativePlatform()) {
    try {
      OneSignal.User.addTags({
        user_id: userId,
        user_email: email,
      })
    } catch (error) {
      console.error('Error tagging native OneSignal user:', error)
    }
    return
  }

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

export function unsubscribeFromNotifications() {
  if (typeof window === 'undefined') return

  if (Capacitor.isNativePlatform()) {
    try {
      OneSignal.User.pushSubscription.optOut()
    } catch (error) {
      console.error('Error opting out of native OneSignal push:', error)
    }
    return
  }

  // @ts-ignore
  window.OneSignalDeferred = window.OneSignalDeferred || []
  // @ts-ignore
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.User.PushSubscription.optOut()
  })
}

export async function sendPushNotification(title: string, message: string, data?: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const response = await fetch(`${baseUrl}/api/send-notification`, {
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