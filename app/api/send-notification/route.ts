// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server'

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-gen-app.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.error('OneSignal credentials missing')
      return NextResponse.json(
        { error: 'OneSignal not configured' },
        { status: 500 }
      )
    }

    const notification = {
      app_id: ONESIGNAL_APP_ID,
      target_channel: 'push',
      included_segments: ['Subscribed Users'],
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      web_buttons: [
        {
          id: 'open-app',
          text: 'Open App',
          icon: `${SITE_URL}/icons/icon-192.png`,
          url: SITE_URL,
        },
      ],
      chrome_web_icon: `${SITE_URL}/icons/icon-192.png`,
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notification),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('OneSignal API error:', result)
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      notificationId: result.id,
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}