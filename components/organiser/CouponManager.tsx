// components/organiser/CouponManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Coffee, Utensils, Settings, RefreshCw } from 'lucide-react'

export function CouponManager() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
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
        // Create default settings
        const defaultSettings = [1, 2, 3, 4, 5].map(day => ({
          day,
          total_meals: 1,
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

  async function saveSettings() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert settings
      for (const setting of settings) {
        const { error } = await supabase
          .from('coupon_settings')
          .upsert({
            day: setting.day,
            total_meals: setting.total_meals,
            breakfast_available: setting.breakfast_available,
            lunch_available: setting.lunch_available,
            dinner_available: setting.dinner_available,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'day' })

        if (error) throw error
      }

      toast.success('✅ Coupon settings saved!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save coupon settings')
    } finally {
      setSaving(false)
    }
  }

  async function generateCoupons(day: number) {
    try {
      const { data: participants } = await supabase
        .from('participants')
        .select('id')
        .eq('checked_in', true)

      if (!participants || participants.length === 0) {
        toast.error('No participants checked in')
        return
      }

      const daySetting = settings.find(s => s.day === day)
      if (!daySetting) return

      const mealTypes = []
      if (daySetting.breakfast_available) mealTypes.push('breakfast')
      if (daySetting.lunch_available) mealTypes.push('lunch')
      if (daySetting.dinner_available) mealTypes.push('dinner')

      const coupons = []
      for (const participant of participants) {
        for (const mealType of mealTypes) {
          coupons.push({
            participant_id: participant.id,
            meal_type: mealType,
            day: day,
            used: false,
            generated_by: (await supabase.auth.getUser()).data.user?.id,
          })
        }
      }

      const { error } = await supabase
        .from('food_coupons')
        .insert(coupons)

      if (error) throw error

      toast.success(`✅ Generated ${coupons.length} coupons for Day ${day}`)
    } catch (error) {
      console.error('Error generating coupons:', error)
      toast.error('Failed to generate coupons')
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
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Settings size={20} className="text-brand-gold" />
            Coupon Settings
          </h3>
          <GoldButton onClick={saveSettings} loading={saving} className="text-sm px-4 py-2">
            <RefreshCw size={14} />
            Save Settings
          </GoldButton>
        </div>

        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.day}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{dayNames[setting.day - 1]}</h4>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-white/60 text-sm">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={setting.total_meals}
                      onChange={(e) => {
                        const newSettings = settings.map(s =>
                          s.day === setting.day
                            ? { ...s, total_meals: parseInt(e.target.value) || 1 }
                            : s
                        )
                        setSettings(newSettings)
                      }}
                      className="w-12 px-2 py-1 rounded-lg bg-white/5 text-white border border-white/10 text-center"
                    />
                    Meals/day
                  </label>
                  <button
                    onClick={() => generateCoupons(setting.day)}
                    className="text-xs px-3 py-1 rounded-lg bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setting.breakfast_available}
                    onChange={(e) => {
                      const newSettings = settings.map(s =>
                        s.day === setting.day
                          ? { ...s, breakfast_available: e.target.checked }
                          : s
                      )
                      setSettings(newSettings)
                    }}
                    className="accent-brand-gold"
                  />
                  <Coffee size={14} /> Breakfast
                </label>
                <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setting.lunch_available}
                    onChange={(e) => {
                      const newSettings = settings.map(s =>
                        s.day === setting.day
                          ? { ...s, lunch_available: e.target.checked }
                          : s
                      )
                      setSettings(newSettings)
                    }}
                    className="accent-brand-gold"
                  />
                  <Utensils size={14} /> Lunch
                </label>
                <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setting.dinner_available}
                    onChange={(e) => {
                      const newSettings = settings.map(s =>
                        s.day === setting.day
                          ? { ...s, dinner_available: e.target.checked }
                          : s
                      )
                      setSettings(newSettings)
                    }}
                    className="accent-brand-gold"
                  />
                  <Utensils size={14} /> Dinner
                </label>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}