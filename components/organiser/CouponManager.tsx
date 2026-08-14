// components/organiser/CouponManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Coffee, Utensils, Moon, Settings, Save, Users, Calendar } from 'lucide-react'

interface CouponSetting {
  id: string
  day: number
  date: string
  breakfast_available: boolean
  lunch_available: boolean
  dinner_available: boolean
}

type MealKey = 'breakfast' | 'lunch' | 'dinner'

const MEAL_META: Record<MealKey, { label: string; icon: any; color: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-yellow-400' },
  lunch: { label: 'Lunch', icon: Utensils, color: 'text-orange-400' },
  dinner: { label: 'Dinner', icon: Moon, color: 'text-purple-400' },
}

export function CouponManager() {
  const [settings, setSettings] = useState<CouponSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [couponCounts, setCouponCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('coupon_settings')
        .select('*')
        .order('day', { ascending: true })

      if (settingsError) throw settingsError
      if (settingsData) setSettings(settingsData)

      const { count, error: countError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true)

      if (!countError) setCheckedInCount(count || 0)

      const { data: couponData, error: couponError } = await supabase
        .from('food_coupons')
        .select('day, count')

      if (!couponError && couponData) {
        const counts: Record<number, number> = {}
        couponData.forEach((c: any) => {
          counts[c.day] = c.count
        })
        setCouponCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load coupon settings')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      for (const setting of settings) {
        const { error } = await supabase
          .from('coupon_settings')
          .update({
            date: setting.date,
            breakfast_available: setting.breakfast_available,
            lunch_available: setting.lunch_available,
            dinner_available: setting.dinner_available,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('day', setting.day)

        if (error) throw error
      }

      toast.success('✅ Meal settings saved!')
      await fetchData()
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleMeal = (day: number, meal: MealKey) => {
    const key = `${meal}_available` as const
    setSettings(settings.map(s =>
      s.day === day ? { ...s, [key]: !s[key] } : s
    ))
  }

  const updateDate = (day: number, date: string) => {
    setSettings(settings.map(s =>
      s.day === day ? { ...s, date } : s
    ))
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
      <GlassCard dark>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-gold/10">
              <Settings size={18} className="text-brand-gold" />
            </div>
            <div>
              <h3 className="text-white font-semibold leading-tight">Meal Settings</h3>
              <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                <Users size={11} /> {checkedInCount} checked in • Coupons auto-generated
              </p>
            </div>
          </div>
          <GoldButton onClick={saveSettings} loading={saving} className="text-sm px-4 py-2 shrink-0">
            <Save size={14} />
            Save Settings
          </GoldButton>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {settings.map((setting) => {
          const totalCoupons = couponCounts[setting.day] || 0
          const dayNum = setting.day

          return (
            <div
              key={setting.day}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <h4 className="text-white font-semibold">{dayNames[dayNum - 1]}</h4>
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <Calendar size={12} />
                    <input
                      type="date"
                      value={setting.date}
                      onChange={(e) => updateDate(dayNum, e.target.value)}
                      className="bg-transparent text-white/60 text-xs border-none focus:outline-none focus:ring-1 focus:ring-brand-gold rounded px-1 py-0.5"
                    />
                  </div>
                </div>
                <span className="text-white/40 text-xs">
                  {totalCoupons > 0 ? `${totalCoupons} coupons generated` : 'No coupons yet'}
                </span>
              </div>

              <div className="px-4 pt-3 pb-4 flex gap-2">
                {(['breakfast', 'lunch', 'dinner'] as MealKey[]).map((meal) => {
                  const { label, icon: Icon, color } = MEAL_META[meal]
                  const active = setting[`${meal}_available` as const]
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => toggleMeal(dayNum, meal)}
                      aria-pressed={active}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand-gold/15 border-brand-gold/60 text-brand-gold'
                          : 'bg-white/5 border-white/10 text-white/35 hover:text-white/60'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-brand-gold' : ''} />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="px-4 pb-4 text-center">
                <p className="text-white/20 text-[10px]">
                  {checkedInCount > 0
                    ? `✅ ${checkedInCount} checked-in participants will get these meals automatically`
                    : '⏳ Coupons will auto-generate when participants check in'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}