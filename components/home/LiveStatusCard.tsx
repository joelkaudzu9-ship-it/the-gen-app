// components/home/LiveStatusCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Session } from '@/lib/types'
import { MapPin, Clock, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface LiveStatusCardProps {
  now: Session | null
  next: Session | null
}

export function LiveStatusCard({ now, next }: LiveStatusCardProps) {
  if (now) {
    return (
      <GlassCard dark>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex" style={{ width: '12px', height: '12px' }}>
              <span
                className="animate-ping absolute rounded-full"
                style={{ display: 'inline-flex', width: '100%', height: '100%', background: '#F87171', opacity: 0.75 }}
              />
              <span
                className="relative rounded-full"
                style={{ display: 'inline-flex', width: '12px', height: '12px', background: '#EF4444' }}
              />
            </span>
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
              LIVE NOW
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{now.title}</h2>
          <div className="flex gap-4 text-sm text-white/70" style={{ flexWrap: 'wrap' }}>
            {now.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {now.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {new Date(now.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(now.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          {now.speaker && (
            <p className="text-sm text-brand-gold flex items-center gap-1">
              <User size={14} /> Speaker: {now.speaker}
            </p>
          )}
        </motion.div>
      </GlassCard>
    )
  }

  if (next) {
    return (
      <GlassCard dark>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span
              className="rounded-full animate-pulse"
              style={{ display: 'inline-block', width: '8px', height: '8px', background: '#EAB308' }}
            />
            <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">
              UP NEXT
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{next.title}</h2>
          <div className="flex gap-4 text-sm text-white/70" style={{ flexWrap: 'wrap' }}>
            {next.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {next.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={16} /> {new Date(next.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="text-brand-gold font-medium">
            Starts in {getTimeUntil(next.start_time)}
          </div>
        </motion.div>
      </GlassCard>
    )
  }

  return (
    <GlassCard dark>
      <div className="text-center" style={{ padding: '16px 0' }}>
        <p className="text-white/70">No sessions scheduled</p>
        <p className="text-sm text-white/40">Enjoy your retreat!</p>
      </div>
    </GlassCard>
  )
}

function getTimeUntil(dateStr: string) {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}