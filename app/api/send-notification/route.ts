// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0]

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')

  return initializeApp({
    credential: cert(serviceAccount),
  })
}

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

    getFirebaseAdmin()

    const { data: tokenRows, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')

    if (error) throw error

    const tokens = (tokenRows || []).map((r) => r.token).filter(Boolean)

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0, note: 'No registered devices' })
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body: message,
      },
      data: data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ) : {},
    })

    // Clean up tokens that are no longer valid (app uninstalled, etc.)
    const deadTokens: string[] = []
    response.responses.forEach((r, i) => {
      if (!r.success && (
        r.error?.code === 'messaging/registration-token-not-registered' ||
        r.error?.code === 'messaging/invalid-registration-token'
      )) {
        deadTokens.push(tokens[i])
      }
    })

    if (deadTokens.length > 0) {
      await supabaseAdmin.from('push_tokens').delete().in('token', deadTokens)
    }

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}