// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getParticipant } from '@/lib/supabase'
import { getLiveStatus } from '@/lib/live-engine'
import { Announcement, LiveStatus, Participant } from '@/lib/types'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { LiveStatusCard } from '@/components/home/LiveStatusCard'
import { AnnouncementCard } from '@/components/home/AnnouncementCard'
import { isAdmin } from '@/lib/admin'
import { getCurrentRetreatDay } from '@/lib/date-utils'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #0A0A0A, #1A1A1A)'

export default function HomePage() {
  const router = useRouter()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ now: null, next: null, later: [] })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [heroImageError, setHeroImageError] = useState(false)
  const [currentDay, setCurrentDay] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndFetch()
    const interval = setInterval(() => {
      getLiveStatus().then(setLiveStatus)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (isAdmin(user.email)) {
        router.push('/dashboard')
        return
      }

      const p = await getParticipant(user.id)
      if (p) setParticipant(p)

      const [status, announcementsData, daySettingsData] = await Promise.all([
        getLiveStatus(),
        supabase
          .from('announcements')
          .select('*')
          .order('priority', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(3),
        supabase
          .from('coupon_settings')
          .select('day, date'),
      ])

      setLiveStatus(status)
      if (announcementsData.data) setAnnouncements(announcementsData.data)
      setCurrentDay(getCurrentRetreatDay(daySettingsData.data || []))
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen pb-24" style={{ background: PAGE_BG }}>
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <AnimatedSection>
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '260px',
              borderRadius: '24px',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 25px rgba(212, 175, 55, 0.15)',
            }}
          >
            {!heroImageError ? (
              <img
                src="/hero-image.png"
                alt=""
                onError={() => setHeroImageError(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #8B7500 100%)',
                }}
              />
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.9) 100%)',
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem 1.5rem',
              }}
            >
              <h1
                className="text-2xl font-bold text-white"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              >
                Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {participant?.full_name?.split(' ')[0] || 'Guest'} 👋
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className="rounded-full bg-brand-gold animate-pulse"
                  style={{ display: 'inline-block', width: '8px', height: '8px' }}
                />
                <p className="text-sm" style={{ color: '#D4AF37', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  DAY {currentDay ?? '—'} • RETREAT 2026
                </p>
              </div>

              <button
                onClick={handleSignOut}
                className="text-sm mt-2 flex items-center gap-1 mx-auto"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </motion.div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <LiveStatusCard now={liveStatus.now} next={liveStatus.next} />
        </AnimatedSection>

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