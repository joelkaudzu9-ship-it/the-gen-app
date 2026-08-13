// app/(main)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase, getParticipant } from '@/lib/supabase'
import { getLiveStatus } from '@/lib/live-engine'
import { Announcement, LiveStatus, Participant } from '@/lib/types'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { LiveStatusCard } from '@/components/home/LiveStatusCard'
import { AnnouncementCard } from '@/components/home/AnnouncementCard'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #0A0A0A, #1A1A1A)'

export default function HomePage() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ now: null, next: null, later: [] })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [heroImageError, setHeroImageError] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      getLiveStatus().then(setLiveStatus)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const p = await getParticipant(user.id)
        if (p) setParticipant(p)
      }

      const [status, announcementsData] = await Promise.all([
        getLiveStatus(),
        supabase
          .from('announcements')
          .select('*')
          .order('priority', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(3)
      ])

      setLiveStatus(status)
      if (announcementsData.data) setAnnouncements(announcementsData.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    window.location.reload()
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen pb-24" style={{ background: PAGE_BG }}>
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* ===== HERO SECTION WITH IMAGE ===== */}
        <AnimatedSection>
          <div className="text-center" style={{ marginBottom: '1.5rem' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                width: '192px',
                height: '192px',
                margin: '0 auto 1rem auto',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 4px 25px rgba(212, 175, 55, 0.15)',
              }}
            >
              {!heroImageError ? (
                <img
                  src="/hero-image.png"
                  alt="Generation Family Retreat"
                  width={192}
                  height={192}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                  onError={() => setHeroImageError(true)}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #8B7500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0A0A0A',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                  }}
                >
                  🏆 GEN-APP
                </div>
              )}
            </motion.div>

            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {participant?.full_name?.split(' ')[0] || 'Guest'} 👋
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className="rounded-full bg-brand-gold animate-pulse"
                style={{ display: 'inline-block', width: '8px', height: '8px' }}
              />
              <p className="text-sm" style={{ color: 'rgba(212,175,55,0.6)' }}>
                DAY {getCurrentDay()} • RETREAT 2026
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="text-white/30 text-sm mt-2 flex items-center gap-1 mx-auto"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </AnimatedSection>

        {/* Live Status */}
        <AnimatedSection delay={0.1}>
          <LiveStatusCard now={liveStatus.now} next={liveStatus.next} />
        </AnimatedSection>

        {/* Announcements */}
        {announcements.length > 0 && (
          <AnimatedSection delay={0.2}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-brand-gold/10" />
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'rgba(212,175,55,0.6)' }}>
                  <span>📢</span> Latest Announcements
                </h3>
                <div className="h-px flex-1 bg-brand-gold/10" />
              </div>
              {announcements.map((announcement, index) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} index={index} />
              ))}
            </div>
          </AnimatedSection>
        )}

        <div style={{ height: '16px' }} />
      </div>
    </div>
  )
}

function getCurrentDay() {
  const startDate = new Date('2026-08-13')
  const now = new Date()
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 5)
}