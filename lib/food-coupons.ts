// lib/food-coupons.ts
import { supabase } from './supabase'
import { getLocalDateString } from './date-utils'

type MealKey = 'breakfast' | 'lunch' | 'dinner'

/**
 * Ensures every eligible participant has a food coupon for every meal
 * that's turned on, for every day whose date has arrived (today or
 * earlier). Safe to call as often as needed — it only ever inserts
 * coupons that don't already exist; it never touches or removes
 * existing ones (used or not).
 *
 * Call this:
 *  - right after a participant is checked in (pass their id)
 *  - right after the organiser saves coupon settings (call with no
 *    args to cover every already-checked-in participant)
 */
export async function ensureCouponCoverage(participantIds?: string[]) {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('coupon_settings')
      .select('*')

    if (settingsError) throw settingsError
    if (!settings || settings.length === 0) return

    const todayStr = getLocalDateString()

    const activeDays = settings.filter((s) => {
      if (!s.date) return false
      return s.date <= todayStr
    })

    if (activeDays.length === 0) return

    let targetParticipantIds: string[]

    if (participantIds && participantIds.length > 0) {
      targetParticipantIds = participantIds
    } else {
      const { data: checkedIn, error: participantsError } = await supabase
        .from('participants')
        .select('id')
        .eq('checked_in', true)

      if (participantsError) throw participantsError
      targetParticipantIds = (checkedIn || []).map((p) => p.id)
    }

    if (targetParticipantIds.length === 0) return

    const rows: {
      participant_id: string
      day: number
      meal_type: MealKey
      used: boolean
      created_at: string
    }[] = []

    for (const participantId of targetParticipantIds) {
      for (const setting of activeDays) {
        const meals: MealKey[] = []
        if (setting.breakfast_available) meals.push('breakfast')
        if (setting.lunch_available) meals.push('lunch')
        if (setting.dinner_available) meals.push('dinner')

        for (const meal of meals) {
          rows.push({
            participant_id: participantId,
            day: setting.day,
            meal_type: meal,
            used: false,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    if (rows.length === 0) return

    const chunkSize = 500
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const { error: upsertError } = await supabase
        .from('food_coupons')
        .upsert(chunk, {
          onConflict: 'participant_id,day,meal_type',
          ignoreDuplicates: true,
        })

      if (upsertError) {
        console.error('Error ensuring coupon coverage:', upsertError)
      }
    }
  } catch (error) {
    console.error('Error in ensureCouponCoverage:', error)
  }
}