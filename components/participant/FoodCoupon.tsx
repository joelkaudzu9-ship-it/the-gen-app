// components/participant/FoodCoupon.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import toast from 'react-hot-toast'
import { CheckCircle2, Coffee, Utensils, Moon, Clock, Ticket, Circle } from 'lucide-react'
import { getLocalDateString } from '@/lib/date-utils'

interface Coupon {
  id: string
  participant_id: string
  meal_type: string
  day: number
  used: boolean
  used_at: string | null
  created_at: string
}

interface DaySetting {
  day: number
  date: string | null
}

type MealKey = 'breakfast' | 'lunch' | 'dinner'

const MEAL_META: Record<MealKey, { label: string; icon: any; color: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-yellow-400' },
  lunch: { label: 'Lunch', icon: Utensils, color: 'text-orange-400' },
  dinner: { label: 'Dinner', icon: Moon, color: 'text-purple-400' },
}

export function FoodCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [daySettings, setDaySettings] = useState<DaySetting[]>([])
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState<any>(null)

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: pData } = await supabase
        .from('participants')
        .select('id, checked_in')
        .eq('user_id', user.id)
        .single()

      if (pData) setParticipant(pData)

      const [{ data: couponData, error: couponError }, { data: settingsData }] = await Promise.all([
        supabase
          .from('food_coupons')
          .select('*')
          .eq('participant_id', pData?.id)
          .order('day', { ascending: true }),
        supabase
          .from('coupon_settings')
          .select('day, date')
          .order('day', { ascending: true }),
      ])

      if (couponError) throw couponError
      if (couponData) setCoupons(couponData as Coupon[])
      if (settingsData) setDaySettings(settingsData as DaySetting[])
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return null
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  function getCurrentMeal(): MealKey | null {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) return 'breakfast'
    if (hour >= 11 && hour < 16) return 'lunch'
    if (hour >= 16 && hour < 22) return 'dinner'
    return null
  }

  const groupedCoupons = coupons.reduce<Record<number, Coupon[]>>((acc, coupon) => {
    if (!acc[coupon.day]) acc[coupon.day] = []
    acc[coupon.day].push(coupon)
    return acc
  }, {})

  // "Today" is whichever configured day's date matches today's real
  // calendar date — not a hardcoded retreat start date.
  const todayStr = getLocalDateString()
  const todaySetting = daySettings.find((s) => s.date === todayStr)
  const currentDay = todaySetting?.day ?? null
  const currentMeal = getCurrentMeal()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Check-in status */}
      <GlassCard dark>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Check-in status</p>
            <p className={`font-semibold ${participant?.checked_in ? 'text-green-500' : 'text-yellow-500'}`}>
              {participant?.checked_in ? 'Checked in' : 'Not checked in'}
            </p>
          </div>
          <span className="text-xs text-white/30 text-right">
            {participant?.checked_in ? 'Coupons available' : 'Check in to get coupons'}
          </span>
        </div>
      </GlassCard>

      {/* Current meal hero */}
      {participant?.checked_in && currentDay && currentMeal && (
        <GlassCard dark className="border-l-4 border-brand-gold">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-brand-gold/20 shrink-0">
              {currentMeal === 'breakfast' ? (
                <Coffee size={24} className="text-brand-gold" />
              ) : currentMeal === 'dinner' ? (
                <Moon size={24} className="text-brand-gold" />
              ) : (
                <Utensils size={24} className="text-brand-gold" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white/60 text-sm flex items-center gap-1">
                <Clock size={14} className="text-brand-gold" />
                Now serving
              </p>
              <p className="text-white font-semibold text-lg leading-tight">
                {MEAL_META[currentMeal].label}
              </p>
              <p className="text-brand-gold/60 text-sm">Show this at the counter</p>
            </div>
            <Ticket size={22} className="text-brand-gold/50 ml-auto shrink-0" />
          </div>
        </GlassCard>
      )}

      {/* All coupons */}
      <GlassCard dark>
        <h3 className="text-white font-semibold mb-3">Your food coupons</h3>
        {Object.keys(groupedCoupons).length === 0 ? (
          <div className="text-center py-6">
            <Ticket size={28} className="text-white/15 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {participant?.checked_in
                ? "No coupons yet — they'll show up here once today's meals are turned on."
                : 'Check in at the desk to unlock your meal coupons.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedCoupons).map(([day, dayCoupons]) => {
              const dayNum = parseInt(day)
              const usedCount = dayCoupons.filter((c: Coupon) => c.used).length
              const allUsed = usedCount === dayCoupons.length
              const isToday = dayNum === currentDay
              const setting = daySettings.find((s) => s.day === dayNum)
              const formattedDate = formatDate(setting?.date)

              return (
                <div
                  key={day}
                  className={`rounded-xl border overflow-hidden ${
                    isToday ? 'bg-brand-gold/5 border-brand-gold/30' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5">
                    <h4 className="text-white font-medium text-sm flex items-center gap-2">
                      {dayNames[dayNum - 1]}
                      {formattedDate && (
                        <span className="text-white/30 font-normal">{formattedDate}</span>
                      )}
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold">
                          Today
                        </span>
                      )}
                    </h4>
                    <span className={`text-xs ${allUsed ? 'text-white/30' : 'text-white/50'}`}>
                      {usedCount}/{dayCoupons.length} used
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {dayCoupons.map((coupon: Coupon) => {
                      const meta = MEAL_META[coupon.meal_type as MealKey] ?? MEAL_META.lunch
                      const Icon = meta.icon
                      const isCurrentMeal = isToday && coupon.meal_type === currentMeal && !coupon.used

                      return (
                        <div
                          key={coupon.id}
                          className={`flex items-center gap-3 px-3.5 py-2.5 ${
                            isCurrentMeal ? 'bg-brand-gold/10' : ''
                          }`}
                        >
                          <Icon size={16} className={coupon.used ? 'text-white/25' : meta.color} />
                          <span className={`text-sm flex-1 ${coupon.used ? 'text-white/30' : 'text-white/80'}`}>
                            {meta.label}
                          </span>
                          {coupon.used ? (
                            <span className="flex items-center gap-1 text-xs text-green-400/80">
                              <CheckCircle2 size={13} /> Used
                            </span>
                          ) : isCurrentMeal ? (
                            <span className="flex items-center gap-1 text-xs text-brand-gold font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                              Available now
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-white/25">
                              <Circle size={11} /> Not yet
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}