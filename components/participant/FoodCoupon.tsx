// components/participant/FoodCoupon.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import toast from 'react-hot-toast'
import { CheckCircle, Coffee, Utensils, Clock, Ticket } from 'lucide-react'

export function FoodCoupon() {
  const [coupons, setCoupons] = useState<any[]>([])
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

      const { data, error } = await supabase
        .from('food_coupons')
        .select('*')
        .eq('participant_id', pData?.id)
        .order('day', { ascending: true })

      if (error) throw error
      if (data) setCoupons(data)
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const mealIcons: Record<string, any> = {
    breakfast: Coffee,
    lunch: Utensils,
    dinner: Utensils,
  }

  const mealColors: Record<string, string> = {
    breakfast: 'text-yellow-400',
    lunch: 'text-orange-400',
    dinner: 'text-purple-400',
  }

  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  // Get current meal based on time of day
  function getCurrentMeal() {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) return 'breakfast'
    if (hour >= 11 && hour < 16) return 'lunch'
    if (hour >= 16 && hour < 22) return 'dinner'
    return null
  }

  // Group coupons by day
  const groupedCoupons = coupons.reduce((acc, coupon) => {
    if (!acc[coupon.day]) acc[coupon.day] = []
    acc[coupon.day].push(coupon)
    return acc
  }, {} as Record<number, any[]>)

  const currentDay = Math.min(Math.max(Math.floor((new Date().getTime() - new Date('2026-08-13').getTime()) / (1000 * 60 * 60 * 24)) + 1, 1), 5)
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
      {/* Check-in Status */}
      <GlassCard dark>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Check-in Status</p>
            <p className={`font-semibold ${participant?.checked_in ? 'text-green-500' : 'text-yellow-500'}`}>
              {participant?.checked_in ? '✅ Checked In' : '⏳ Not Checked In'}
            </p>
          </div>
          <span className="text-xs text-white/30">
            {participant?.checked_in ? '🎟️ Coupons available' : 'Check in to get coupons'}
          </span>
        </div>
      </GlassCard>

      {/* Current Meal - Highlighted */}
      {participant?.checked_in && currentMeal && (
        <GlassCard dark className="border-l-4 border-brand-gold">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-brand-gold/20">
              {currentMeal === 'breakfast' ? <Coffee size={24} className="text-brand-gold" /> : <Utensils size={24} className="text-brand-gold" />}
            </div>
            <div>
              <p className="text-white/60 text-sm flex items-center gap-1">
                <Clock size={14} className="text-brand-gold" />
                Now Available
              </p>
              <p className="text-white font-semibold text-lg">
                {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)}
              </p>
              <p className="text-brand-gold/60 text-sm">Tap to use your coupon</p>
            </div>
            <div className="ml-auto">
              <Ticket size={24} className="text-brand-gold" />
            </div>
          </div>
        </GlassCard>
      )}

      {/* All Coupons */}
      <GlassCard dark>
        <h3 className="text-white font-semibold mb-4">All Food Coupons</h3>
        {Object.keys(groupedCoupons).length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">
            {participant?.checked_in 
              ? 'No food coupons available. Contact an organiser.'
              : 'Please check in to access your food coupons.'}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedCoupons).map(([day, dayCoupons]) => {
              const dayNum = parseInt(day)
              const allUsed = dayCoupons.every((c: any) => c.used)
              const hasAvailable = dayCoupons.some((c: any) => !c.used)
              const isToday = dayNum === currentDay

              return (
                <div
                  key={day}
                  className={`p-4 rounded-xl border ${
                    isToday ? 'bg-brand-gold/5 border-brand-gold/30' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">
                      {dayNames[dayNum - 1]}
                      {isToday && <span className="ml-2 text-xs text-brand-gold">● Today</span>}
                    </h4>
                    <span className={`text-xs ${allUsed ? 'text-green-400' : hasAvailable ? 'text-brand-gold' : 'text-white/30'}`}>
                      {allUsed ? '✅ All Used' : hasAvailable ? `${dayCoupons.filter((c: any) => !c.used).length} available` : 'No coupons'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dayCoupons.map((coupon: any) => {
                      const Icon = mealIcons[coupon.meal_type] || Utensils
                      const color = mealColors[coupon.meal_type] || 'text-white/40'
                      return (
                        <div
                          key={coupon.id}
                          className={`p-2 rounded-lg text-center ${
                            coupon.used
                              ? 'bg-white/5 opacity-50'
                              : isToday && coupon.meal_type === currentMeal
                              ? 'bg-brand-gold/20 border border-brand-gold'
                              : 'bg-white/10'
                          }`}
                        >
                          <Icon size={18} className={`mx-auto ${coupon.used ? 'text-white/30' : color}`} />
                          <p className={`text-xs mt-1 ${coupon.used ? 'text-white/30' : 'text-white/60'}`}>
                            {coupon.meal_type.charAt(0).toUpperCase() + coupon.meal_type.slice(1)}
                          </p>
                          {coupon.used && (
                            <p className="text-[10px] text-green-400">✓ Used</p>
                          )}
                          {!coupon.used && isToday && coupon.meal_type === currentMeal && (
                            <p className="text-[10px] text-brand-gold animate-pulse">Available Now</p>
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