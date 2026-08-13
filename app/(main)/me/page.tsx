// app/(main)/me/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase, getParticipant } from '@/lib/supabase'
import { Participant } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { MeSkeleton } from '@/components/ui/LoadingSkeleton'
import { QRCodeCanvas } from 'qrcode.react'
import { Users, Bus, CheckCircle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const GOLD_GRADIENT_DIAG = 'linear-gradient(135deg, #D4AF37 0%, #8B7500 100%)'
const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #0A0A0A, #1A1A1A)'

export default function MePage() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const p = await getParticipant(user.id)
        if (p) setParticipant(p)
      }
    } catch (error) {
      console.error('Error fetching participant:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Profile updated')
  }

  if (loading) return <MeSkeleton />

  return (
    <div className="min-h-screen p-4 pb-24" style={{ background: PAGE_BG }}>
      <div className="flex items-center justify-between mb-4">
        <AnimatedSection>
          <h1 className="text-2xl font-bold text-white">My Retreat</h1>
        </AnimatedSection>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-white/40 rounded-xl"
          style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Digital ID Card */}
      <AnimatedSection delay={0.1}>
        <GlassCard dark className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Avatar */}
            <div
              className="rounded-full mx-auto flex items-center justify-center font-bold text-black shadow-gold mb-4"
              style={{ width: '96px', height: '96px', background: GOLD_GRADIENT_DIAG, fontSize: '1.875rem' }}
            >
              {participant?.full_name?.charAt(0) || 'G'}
            </div>

            <h2 className="text-xl font-bold text-white">{participant?.full_name || 'Guest'}</h2>
            {participant?.university && (
              <p className="text-white/60 text-sm">{participant.university}</p>
            )}
            {participant?.groups && (
              <p className="text-brand-gold text-sm mt-1 font-medium">
                🏠 {participant.groups.name}
              </p>
            )}

            {/* QR Code */}
            <div
              className="mt-4 rounded-xl"
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                padding: '16px',
                boxShadow: '0 4px 25px rgba(0,0,0,0.3)',
              }}
            >
              <QRCodeCanvas
                value={participant?.id || 'no-id'}
                size={160}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#0A0A0A"
              />
            </div>
            <p className="text-white/30 text-xs mt-2">📱 Scan for check-in</p>
          </motion.div>
        </GlassCard>
      </AnimatedSection>

      {/* Details */}
      <div className="space-y-3 mt-4">
        {/* Group Info */}
        {participant?.groups && (
          <AnimatedSection delay={0.2}>
            <GlassCard dark>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-gold/10" style={{ padding: '8px' }}>
                  <Users size={18} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">My Group</p>
                  <p className="text-white font-semibold text-lg">{participant.groups.name}</p>
                  {participant.groups.leader_name && (
                    <p className="text-white/40 text-sm">👤 Leader: {participant.groups.leader_name}</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        )}

        {/* Transport Info */}
        {participant?.transport && (
          <AnimatedSection delay={0.3}>
            <GlassCard dark>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-gold/10" style={{ padding: '8px' }}>
                  <Bus size={18} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">My Transport</p>
                  <p className="text-white font-semibold text-lg">{participant.transport.bus_number}</p>
                  {participant.transport.departure_time && (
                    <p className="text-white/40 text-sm">
                      🕐 Departs: {new Date(participant.transport.departure_time).toLocaleString()}
                    </p>
                  )}
                  {participant.transport.meeting_point && (
                    <p className="text-white/40 text-sm">📍 Meeting: {participant.transport.meeting_point}</p>
                  )}
                  <span
                    className="text-xs rounded-full mt-1"
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: participant.transport.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: participant.transport.status === 'active' ? '#4ADE80' : '#F87171',
                    }}
                  >
                    {participant.transport.status === 'active' ? '🟢 Active' : '🔴 Departed'}
                  </span>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        )}

        {/* Check-in Status */}
        <AnimatedSection delay={0.4}>
          <GlassCard dark>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className={participant?.checked_in ? 'text-green-500' : 'text-yellow-500'} />
                <div>
                  <p className="text-white/60 text-sm">Check-in Status</p>
                  <p className={`font-semibold ${participant?.checked_in ? 'text-green-500' : 'text-yellow-500'}`}>
                    {participant?.checked_in ? '✅ Checked In' : '⏳ Not Checked In'}
                  </p>
                </div>
              </div>
              {participant?.checked_in_at && (
                <p className="text-white/30 text-xs">
                  {new Date(participant.checked_in_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </GlassCard>
        </AnimatedSection>
      </div>
    </div>
  )
}