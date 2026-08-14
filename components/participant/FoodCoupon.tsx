// components/participant/FoodCoupon.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Coffee, Utensils } from 'lucide-react'

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

      // Get participant
      const { data: pData } = await supabase
        .from('participants')
        .select('id, checked_in')
        .eq('user_id', user.id)
        .single()

      if (pData) setParticipant(pData)

      // Get coupons
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
            Meals available after check-in
          </span>
        </div>
      </GlassCard>

      {/* Coupons */}
      <GlassCard dark>
        <h3 className="text-white font-semibold mb-3">Food Coupons</h3>
        {coupons.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">
            {participant?.checked_in 
              ? 'No food coupons available. Contact an organiser.'
              : 'Please check in to access your food coupons.'}
          </p>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => {
              const Icon = mealIcons[coupon.meal_type] || Utensils
              const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']
              return (
                <div
                  key={coupon.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    coupon.used ? 'bg-white/5 opacity-60' : 'bg-brand-gold/5 border border-brand-gold/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={coupon.used ? 'text-white/30' : 'text-brand-gold'} />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {coupon.meal_type.charAt(0).toUpperCase() + coupon.meal_type.slice(1)}
                      </p>
                      <p className="text-white/40 text-xs">{dayNames[coupon.day - 1]}</p>
                    </div>
                  </div>
                  {coupon.used ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle size={14} /> Used
                    </span>
                  ) : (
                    <span className="text-xs text-brand-gold">Available</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}