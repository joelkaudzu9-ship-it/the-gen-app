// components/organiser/CouponManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Coffee, Utensils, Settings, RefreshCw, Users, CheckCircle, AlertCircle } from 'lucide-react'

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

export function CouponManager() {
  const [settings, setSettings] = useState<CouponSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<number, CouponStats>>({})

  useEffect(() => {
    fetchSettings()
    fetchAllStats()
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

  async function saveSettings() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Check if settings exist in database
      const { data: existingSettings, error: fetchError } = await supabase
        .from('coupon_settings')
        .select('id, day')

      if (fetchError) throw fetchError

      const existingDayMap = new Map(
        (existingSettings || []).map(s => [s.day, s.id])
      )

      // Perform upsert operations
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
          // Update existing
          const { error: updateError } = await supabase
            .from('coupon_settings')
            .update(settingData)
            .eq('day', setting.day)
          error = updateError
        } else {
          // Insert new
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

      toast.success('✅ Coupon settings saved!')
      await fetchSettings() // Refresh to get updated IDs
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
      // Get all checked-in participants
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id, full_name')
        .eq('checked_in', true)

      if (participantsError) throw participantsError

      if (!participants || participants.length === 0) {
        toast.error('No participants checked in')
        setGenerating(null)
        return
      }

      // Get settings for this day
      const daySetting = settings.find(s => s.day === day)
      if (!daySetting) {
        toast.error('No settings found for this day')
        setGenerating(null)
        return
      }

      // Determine meal types based on settings
      const mealTypes = []
      if (daySetting.breakfast_available) mealTypes.push('breakfast')
      if (daySetting.lunch_available) mealTypes.push('lunch')
      if (daySetting.dinner_available) mealTypes.push('dinner')

      if (mealTypes.length === 0) {
        toast.error('No meals enabled for this day')
        setGenerating(null)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        setGenerating(null)
        return
      }

      // Build coupons array
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

      // Delete existing coupons for this day (to avoid duplicates)
      const { error: deleteError } = await supabase
        .from('food_coupons')
        .delete()
        .eq('day', day)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        // Continue anyway
      }

      // Insert new coupons in batches to avoid payload size issues
      const batchSize = 500
      for (let i = 0; i < coupons.length; i += batchSize) {
        const batch = coupons.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('food_coupons')
          .insert(batch)

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }

      toast.success(`✅ Generated ${coupons.length} coupons for Day ${day}`)
      await fetchAllStats() // Refresh stats
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
          {settings.map((setting) => {
            const dayStats = stats[setting.day]
            return (
              <div
                key={setting.day}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-gold/20 transition-colors"
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
                        className="w-12 px-2 py-1 rounded-lg bg-white/5 text-white border border-white/10 text-center focus:border-brand-gold focus:outline-none"
                      />
                      Meals/day
                    </label>
                    <button
                      onClick={() => generateCoupons(setting.day)}
                      disabled={generating === setting.day}
                      className="text-xs px-3 py-1 rounded-lg bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generating === setting.day ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-brand-gold border-t-transparent" />
                          Generating...
                        </span>
                      ) : (
                        'Generate Coupons'
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors">
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
                  <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors">
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
                  <label className="flex items-center gap-1 text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors">
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

                {/* Coupon Stats */}
                {dayStats && dayStats.total > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs">
                    <span className="text-white/40 flex items-center gap-1">
                      <Users size={12} />
                      Total: {dayStats.total}
                    </span>
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Used: {dayStats.used}
                    </span>
                    <span className="text-white/30 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Unused: {dayStats.unused}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}