// lib/push.ts
'use client'

import { supabase } from './supabase'

export async function registerPushToken(token: string, platform: 'android' | 'web') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: user.id, token, platform, updated_at: new Date().toISOString() },
        { onConflict: 'token' }
      )
  } catch (error) {
    console.error('Error registering push token:', error)
  }
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