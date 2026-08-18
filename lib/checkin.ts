// lib/checkin.ts
import { supabase, getParticipant } from './supabase'
import { getCurrentRetreatDay } from './date-utils'
import { ensureCouponCoverage } from './food-coupons'

export async function selfCheckIn(scannedCode: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Not signed in' }

    const participant = await getParticipant(user.id)
    if (!participant) return { success: false, message: 'Participant profile not found' }

    const { data: codeRow, error: codeError } = await supabase
      .from('app_meta')
      .select('value')
      .eq('key', 'checkin_code')
      .maybeSingle()

    if (codeError || !codeRow) {
      return { success: false, message: 'Check-in is not set up yet — ask an organiser' }
    }

    if (scannedCode.trim() !== codeRow.value.trim()) {
      return { success: false, message: 'That QR code is not valid for check-in' }
    }

    const { data: settings } = await supabase.from('coupon_settings').select('day, date')
    const day = getCurrentRetreatDay(settings || [])
    if (!day) return { success: false, message: 'The retreat has not started yet' }

    const { data: existing } = await supabase
      .from('daily_checkins')
      .select('checked_in')
      .eq('participant_id', participant.id)
      .eq('day', day)
      .maybeSingle()

    if (existing?.checked_in) {
      return { success: false, message: "You're already checked in for today" }
    }

    const nowIso = new Date().toISOString()

    const { error: dailyError } = await supabase
      .from('daily_checkins')
      .upsert(
        { participant_id: participant.id, day, checked_in: true, checked_in_at: nowIso },
        { onConflict: 'participant_id,day' }
      )
    if (dailyError) throw dailyError

    // First-ever check-in also flips the overall participant flag and
    // logs attendance, matching what the organiser's QRScanner does.
    if (!participant.checked_in) {
      await supabase
        .from('participants')
        .update({ checked_in: true, checked_in_at: nowIso })
        .eq('id', participant.id)

      await supabase.from('attendance').insert({
        participant_id: participant.id,
        scanned_at: nowIso,
      })
    }

    await ensureCouponCoverage([participant.id])

    return { success: true, message: "You're checked in! Enjoy today's sessions 🎉" }
  } catch (error) {
    console.error('Self check-in error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}