// app/(organiser)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureCouponCoverage } from '@/lib/food-coupons'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  Users,
  UserCheck,
  Bus,
  LifeBuoy,
  Calendar,
  LayoutGrid,
  Camera,
  Megaphone,
  RefreshCw,
  Ticket,
  Clock,
} from 'lucide-react'
import { QRScanner } from '@/components/organiser/QRScanner'
import { AnnouncementPublisher } from '@/components/organiser/AnnouncementPublisher'
import { HelpDesk } from '@/components/organiser/HelpDesk'
import { CouponManager } from '@/components/organiser/CouponManager'
import { SessionManager } from '@/components/organiser/SessionManager'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface DashboardStats {
  totalParticipants: number
  checkedIn: number
  attendancePercentage: number
  activeBuses: number
  pendingHelpRequests: number
  currentSession: any
  nextSession: any
}

const defaultStats: DashboardStats = {
  totalParticipants: 0,
  checkedIn: 0,
  attendancePercentage: 0,
  activeBuses: 0,
  pendingHelpRequests: 0,
  currentSession: null,
  nextSession: null,
}

const GOLD_GRADIENT = 'linear-gradient(135deg, #D4AF37 0%, #B8960F 50%, #8B7500 100%)'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'announcements' | 'help' | 'coupons' | 'sessions'>('overview')

  useEffect(() => {
    fetchStats()
    // Also keeps food coupon coverage in sync — this is what catches a new
    // retreat day starting with no organiser action required. As long as
    // this dashboard is open sometime after midnight, coverage backfills
    // automatically within 30 seconds of the day beginning.
    ensureCouponCoverage()

    const interval = setInterval(() => {
      fetchStats()
      ensureCouponCoverage()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const { count: totalParticipants } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      const { count: checkedIn } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true)

      const { count: pendingHelp } = await supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: activeBuses } = await supabase
        .from('transport')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const now = new Date().toISOString()
      const { data: currentSession } = await supabase
        .from('sessions')
        .select('*')
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle()

      const { data: nextSession } = await supabase
        .from('sessions')
        .select('*')
        .gt('start_time', now)
        .order('start_time')
        .limit(1)
        .maybeSingle()

      const total = totalParticipants || 0
      const checked = checkedIn || 0

      setStats({
        totalParticipants: total,
        checkedIn: checked,
        attendancePercentage: total > 0 ? Math.round((checked / total) * 100) : 0,
        activeBuses: activeBuses || 0,
        pendingHelpRequests: pendingHelp || 0,
        currentSession: currentSession || null,
        nextSession: nextSession || null,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    await ensureCouponCoverage()
    setRefreshing(false)
    toast.success('Dashboard updated')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div
          className="animate-spin rounded-full"
          style={{ width: 48, height: 48, border: '4px solid #D4AF37', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'scanner', label: 'Scanner', icon: Camera },
    { id: 'announcements', label: 'Announce', icon: Megaphone },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    { id: 'help', label: 'Help', icon: LifeBuoy },
  ] as const

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">Updated: {new Date().toLocaleTimeString()}</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-full"
          style={{
            padding: '6px 12px',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            color: '#D4AF37',
            fontSize: '12px',
            fontWeight: 500,
            cursor: refreshing ? 'default' : 'pointer',
            opacity: refreshing ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard dark className="text-center" style={{ padding: '12px' }}>
          <Users size={20} className="text-brand-gold mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{stats.totalParticipants || 0}</p>
          <p className="text-white/40 text-xs">Total</p>
        </GlassCard>

        <GlassCard dark className="text-center" style={{ padding: '12px' }}>
          <UserCheck size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{stats.checkedIn || 0}</p>
          <p className="text-white/40 text-xs">Checked In</p>
          <p className="text-green-500" style={{ fontSize: '10px' }}>{stats.attendancePercentage || 0}%</p>
        </GlassCard>

        <GlassCard dark className="text-center" style={{ padding: '12px' }}>
          <Bus size={20} className="mx-auto mb-1" style={{ color: '#3B82F6' }} />
          <p className="text-xl font-bold text-white">{stats.activeBuses || 0}</p>
          <p className="text-white/40 text-xs">Buses</p>
        </GlassCard>

        <GlassCard dark className="text-center relative" style={{ padding: '12px' }}>
          <LifeBuoy
            size={20}
            className="mx-auto mb-1"
            style={{ color: (stats.pendingHelpRequests || 0) > 0 ? '#EF4444' : '#D4AF37' }}
          />
          <p className="text-xl font-bold text-white">{stats.pendingHelpRequests || 0}</p>
          <p className="text-white/40 text-xs">Help</p>
          {(stats.pendingHelpRequests || 0) > 0 && (
            <span
              className="absolute rounded-full animate-pulse"
              style={{ top: '-4px', right: '-4px', width: 12, height: 12, background: '#EF4444' }}
            />
          )}
        </GlassCard>
      </div>

      {/* Current Session - Compact */}
      {stats.currentSession && (
        <GlassCard dark style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-gold/10" style={{ padding: '8px' }}>
              <Calendar size={18} className="text-brand-gold" />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <p className="text-white/40 uppercase tracking-wider" style={{ fontSize: '10px' }}>Now</p>
              <p
                className="text-white font-semibold text-sm"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {stats.currentSession.title}
              </p>
              <p className="text-white/40 text-xs">
                {stats.currentSession.location} • {new Date(stats.currentSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span
              className="flex items-center gap-1 rounded-full"
              style={{ fontSize: '10px', background: 'rgba(239,68,68,0.2)', color: '#F87171', padding: '4px 8px' }}
            >
              <span className="rounded-full animate-pulse" style={{ width: 6, height: 6, background: '#EF4444' }} />
              LIVE
            </span>
          </div>
        </GlassCard>
      )}

      {/* Tabs - Updated to include Sessions */}
      <div className="grid grid-cols-6 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center rounded-xl"
              style={{
                gap: '4px',
                padding: '10px 4px',
                transition: 'all 0.3s ease',
                background: isActive ? GOLD_GRADIENT : 'rgba(255,255,255,0.05)',
                boxShadow: isActive ? '0 4px 25px rgba(212,175,55,0.35)' : 'none',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#0A0A0A' : 'rgba(255,255,255,0.6)' }} />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  color: isActive ? '#0A0A0A' : 'rgba(255,255,255,0.6)',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {activeTab === 'overview' && (
          <GlassCard dark>
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs">Attendance</span>
              <span className="text-white/60 text-sm font-medium">{stats.attendancePercentage || 0}%</span>
            </div>
            <div
              className="mt-2 rounded-full"
              style={{ height: '8px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}
            >
              <div
                className="rounded-full"
                style={{
                  height: '100%',
                  background: GOLD_GRADIENT,
                  width: `${stats.attendancePercentage || 0}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1">{stats.checkedIn || 0} of {stats.totalParticipants || 0} checked in</p>
          </GlassCard>
        )}

        {activeTab === 'scanner' && <QRScanner />}
        {activeTab === 'announcements' && <AnnouncementPublisher />}
        {activeTab === 'coupons' && <CouponManager />}
        {activeTab === 'sessions' && <SessionManager />}
        {activeTab === 'help' && <HelpDesk />}
      </div>
    </div>
  )
}