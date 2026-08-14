// components/organiser/CouponManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Coffee, Utensils, Moon, Settings, Save, Users, Ticket } from 'lucide-react'

interface CouponSetting {
  id?: string
  day: number
  total_meals: number
  breakfast_available: boolean
  lunch_available: boolean
  dinner_available: boolean
  updated_by?: string
  updated_at?: string
}

interface CouponStats {
  total: number
  used: number
  unused: number
}

type MealKey = 'breakfast' | 'lunch' | 'dinner'

const MEAL_META: Record<MealKey, { label: string; icon: any }> = {
  breakfast: { label: 'Breakfast', icon: Coffee },
  lunch: { label: 'Lunch', icon: Utensils },
  dinner: { label: 'Dinner', icon: Moon },
}

export function CouponManager() {
  const [settings, setSettings] = useState<CouponSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<number, CouponStats>>({})
  const [checkedInCount, setCheckedInCount] = useState(0)

  useEffect(() => {
    fetchSettings()
    fetchAllStats()
    fetchCheckedInCount()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('coupon_settings')
        .select('*')
        .order('day', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setSettings(data)
      } else {
        const defaultSettings = [1, 2, 3, 4, 5].map(day => ({
          day,
          total_meals: 3,
          breakfast_available: true,
          lunch_available: true,
          dinner_available: true,
        }))
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error fetching coupon settings:', error)
      toast.error('Failed to load coupon settings')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllStats() {
    try {
      const { data, error } = await supabase
        .from('food_coupons')
        .select('day, used')

      if (error) throw error

      const statsMap: Record<number, CouponStats> = {}
      for (const coupon of data || []) {
        if (!statsMap[coupon.day]) {
          statsMap[coupon.day] = { total: 0, used: 0, unused: 0 }
        }
        statsMap[coupon.day].total++
        if (coupon.used) {
          statsMap[coupon.day].used++
        } else {
          statsMap[coupon.day].unused++
        }
      }
      setStats(statsMap)
    } catch (error) {
      console.error('Error fetching coupon stats:', error)
    }
  }

  async function fetchCheckedInCount() {
    try {
      const { count, error } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true)

      if (error) throw error
      setCheckedInCount(count || 0)
    } catch (error) {
      console.error('Error fetching checked-in count:', error)
    }
  }

  function toggleMeal(day: number, meal: MealKey) {
    const key = `${meal}_available` as const
    const newSettings = settings.map(s => (s.day === day ? { ...s, [key]: !s[key] } : s))
    // total_meals always reflects how many meal types are actually enabled,
    // so it can never drift from what Generate will actually produce
    setSettings(
      newSettings.map(s => ({
        ...s,
        total_meals:
          Number(s.breakfast_available) + Number(s.lunch_available) + Number(s.dinner_available),
      }))
    )
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data: existingSettings, error: fetchError } = await supabase
        .from('coupon_settings')
        .select('id, day')

      if (fetchError) throw fetchError

      const existingDayMap = new Map(
        (existingSettings || []).map(s => [s.day, s.id])
      )

      for (const setting of settings) {
        const settingData = {
          day: setting.day,
          total_meals: setting.total_meals,
          breakfast_available: setting.breakfast_available,
          lunch_available: setting.lunch_available,
          dinner_available: setting.dinner_available,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        }

        let error
        if (existingDayMap.has(setting.day)) {
          const { error: updateError } = await supabase
            .from('coupon_settings')
            .update(settingData)
            .eq('day', setting.day)
          error = updateError
        } else {
          const { error: insertError } = await supabase
            .from('coupon_settings')
            .insert(settingData)
          error = insertError
        }

        if (error) {
          console.error('Error saving setting for day', setting.day, error)
          throw error
        }
      }

      toast.success('Settings saved')
      await fetchSettings()
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save coupon settings')
    } finally {
      setSaving(false)
    }
  }

  async function generateCoupons(day: number) {
    setGenerating(day)
    try {
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id')
        .eq('checked_in', true)

      if (participantsError) throw participantsError

      if (!participants || participants.length === 0) {
        toast.error('No participants checked in yet')
        setGenerating(null)
        return
      }

      const daySetting = settings.find(s => s.day === day)
      if (!daySetting) {
        toast.error('No settings found for this day')
        setGenerating(null)
        return
      }

      const mealTypes: MealKey[] = []
      if (daySetting.breakfast_available) mealTypes.push('breakfast')
      if (daySetting.lunch_available) mealTypes.push('lunch')
      if (daySetting.dinner_available) mealTypes.push('dinner')

      if (mealTypes.length === 0) {
        toast.error('Turn on at least one meal before generating')
        setGenerating(null)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        setGenerating(null)
        return
      }

      const { error: deleteError } = await supabase
        .from('food_coupons')
        .delete()
        .eq('day', day)

      if (deleteError) {
        console.error('Delete error:', deleteError)
      }

      const coupons = []
      for (const participant of participants) {
        for (const mealType of mealTypes) {
          coupons.push({
            participant_id: participant.id,
            meal_type: mealType,
            day: day,
            used: false,
            generated_by: user.id,
            created_at: new Date().toISOString(),
          })
        }
      }

      const chunkSize = 500
      let insertedCount = 0
      for (let i = 0; i < coupons.length; i += chunkSize) {
        const chunk = coupons.slice(i, i + chunkSize)
        const { error: insertError } = await supabase
          .from('food_coupons')
          .insert(chunk)

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
        insertedCount += chunk.length
      }

      toast.success(`Generated ${insertedCount} coupons for Day ${day}`)
      await fetchAllStats()
    } catch (error: any) {
      console.error('Error generating coupons:', error)
      toast.error(error.message || 'Failed to generate coupons')
    } finally {
      setGenerating(null)
    }
  }

  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard dark>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-gold/10">
              <Settings size={18} className="text-brand-gold" />
            </div>
            <div>
              <h3 className="text-white font-semibold leading-tight">Coupon Settings</h3>
              <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                <Users size={11} /> {checkedInCount} checked in right now
              </p>
            </div>
          </div>
          <GoldButton onClick={saveSettings} loading={saving} className="text-sm px-4 py-2 shrink-0">
            <Save size={14} />
            Save
          </GoldButton>
        </div>
      </GlassCard>

      {/* Per-day cards */}
      <div className="space-y-3">
        {settings.map((setting) => {
          const dayStats = stats[setting.day]
          const total = dayStats?.total ?? 0
          const used = dayStats?.used ?? 0
          const pct = total > 0 ? Math.round((used / total) * 100) : 0
          const mealsOn = (['breakfast', 'lunch', 'dinner'] as MealKey[]).filter(
            m => setting[`${m}_available` as const]
          )
          const isGenerating = generating === setting.day
          const projectedCoupons = checkedInCount * mealsOn.length

          return (
            <div
              key={setting.day}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              {/* Day header: name + progress */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                <h4 className="text-white font-semibold">{dayNames[setting.day - 1]}</h4>
                {total > 0 ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/50 text-xs whitespace-nowrap">
                      {used}/{total} used
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-white/30 text-xs">Not generated yet</span>
                )}
              </div>

              {/* Meal toggle chips */}
              <div className="px-4 pt-3 flex gap-2">
                {(['breakfast', 'lunch', 'dinner'] as MealKey[]).map((meal) => {
                  const { label, icon: Icon } = MEAL_META[meal]
                  const active = setting[`${meal}_available` as const]
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => toggleMeal(setting.day, meal)}
                      aria-pressed={active}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand-gold/15 border-brand-gold/60 text-brand-gold'
                          : 'bg-white/5 border-white/10 text-white/35 hover:text-white/60'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Generate action */}
              <div className="p-4 pt-3">
                <button
                  onClick={() => generateCoupons(setting.day)}
                  disabled={isGenerating || mealsOn.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-gold/15 text-brand-gold text-sm font-medium hover:bg-brand-gold/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-brand-gold border-t-transparent" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Ticket size={14} />
                      {mealsOn.length === 0
                        ? 'Turn on a meal to generate'
                        : `Generate for ${dayNames[setting.day - 1]} · ~${projectedCoupons} coupons`}
                    </>
                  )}
                </button>
                {total > 0 && (
                  <p className="text-white/30 text-[11px] text-center mt-2">
                    Regenerating replaces all {total} existing coupons for this day
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
