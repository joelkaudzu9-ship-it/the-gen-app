// app/(organiser)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { 
  Users, 
  UserCheck, 
  Bus, 
  LifeBuoy, 
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { QRScanner } from '@/components/organiser/QRScanner'
import { AnnouncementPublisher } from '@/components/organiser/AnnouncementPublisher'
import { HelpDesk } from '@/components/organiser/HelpDesk'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface DashboardStats {
  totalParticipants: number
  checkedIn: number
  attendancePercentage: number
  activeBuses: number
  pendingHelpRequests: number
  totalSessions: number
  currentSession: any
  nextSession: any
}

const defaultStats: DashboardStats = {
  totalParticipants: 0,
  checkedIn: 0,
  attendancePercentage: 0,
  activeBuses: 0,
  pendingHelpRequests: 0,
  totalSessions: 0,
  currentSession: null,
  nextSession: null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'announcements' | 'help'>('overview')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
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
        totalSessions: 0,
        currentSession: currentSession || null,
        nextSession: nextSession || null,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    toast.success('Dashboard updated')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-white/40 hover:text-[#D4AF37] transition-colors p-2 rounded-xl hover:bg-white/5"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedSection delay={0.1}>
          <GlassCard dark className="text-center">
            <Users size={28} className="text-[#D4AF37] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalParticipants || 0}</p>
            <p className="text-white/40 text-sm">Total Participants</p>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <GlassCard dark className="text-center">
            <UserCheck size={28} className="text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.checkedIn || 0}</p>
            <p className="text-white/40 text-sm">Checked In</p>
            <p className="text-xs text-green-500">{stats.attendancePercentage || 0}%</p>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <GlassCard dark className="text-center">
            <Bus size={28} className="text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.activeBuses || 0}</p>
            <p className="text-white/40 text-sm">Active Buses</p>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.4}>
          <GlassCard dark className="text-center cursor-pointer hover:border-[#D4AF37]/30 transition-all">
            <LifeBuoy size={28} className={`mx-auto mb-2 ${(stats.pendingHelpRequests || 0) > 0 ? 'text-red-500' : 'text-[#D4AF37]'}`} />
            <p className="text-2xl font-bold text-white">{stats.pendingHelpRequests || 0}</p>
            <p className="text-white/40 text-sm">Pending Help</p>
            {(stats.pendingHelpRequests || 0) > 0 && (
              <span className="inline-block mt-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
                Needs attention
              </span>
            )}
          </GlassCard>
        </AnimatedSection>
      </div>

      {/* Current Session */}
      <AnimatedSection delay={0.5}>
        <GlassCard dark>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#D4AF37]/10">
              <Calendar size={24} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-sm">Current Session</p>
              {stats.currentSession ? (
                <>
                  <p className="text-white font-semibold text-lg">{stats.currentSession.title}</p>
                  <p className="text-white/60 text-sm">
                    {stats.currentSession.location} • 
                    {new Date(stats.currentSession.start_time).toLocaleTimeString()} - 
                    {new Date(stats.currentSession.end_time).toLocaleTimeString()}
                  </p>
                </>
              ) : stats.nextSession ? (
                <>
                  <p className="text-yellow-500 font-semibold text-lg">⏳ Up Next</p>
                  <p className="text-white font-semibold text-lg">{stats.nextSession.title}</p>
                  <p className="text-white/60 text-sm">
                    {stats.nextSession.location} • 
                    Starts at {new Date(stats.nextSession.start_time).toLocaleTimeString()}
                  </p>
                </>
              ) : (
                <p className="text-white/40">No sessions scheduled</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stats.currentSession && (
                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  LIVE
                </span>
              )}
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'scanner', label: '📷 Scanner' },
          { id: 'announcements', label: '📢 Announcements' },
          { id: 'help', label: '🆘 Help Desk' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#8B7500] text-black shadow-[0_4px_25px_rgba(212,175,55,0.35)]' 
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <GlassCard dark>
            <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-sm">Attendance Progress</p>
                <div className="mt-2 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8B7500] rounded-full transition-all duration-500"
                    style={{ width: `${stats.attendancePercentage || 0}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm mt-1">{stats.attendancePercentage || 0}%</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Check-in Status</p>
                <p className="text-white font-semibold text-lg">{stats.checkedIn || 0} / {stats.totalParticipants || 0}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === 'scanner' && <QRScanner />}
        {activeTab === 'announcements' && <AnnouncementPublisher />}
        {activeTab === 'help' && <HelpDesk />}
      </div>
    </div>
  )
}