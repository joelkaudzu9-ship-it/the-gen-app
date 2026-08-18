// components/home/AnnouncementCard.tsx
'use client'

import { Announcement } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

interface AnnouncementCardProps {
  announcement: Announcement
  index: number
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g

async function openLink(url: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url })
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } catch (error) {
    console.error('Failed to open link:', error)
  }
}

function renderMessageWithLinks(message: string) {
  const parts = message.split(URL_REGEX)

  return parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      return (
        <button
          key={i}
          onClick={() => openLink(part)}
          className="text-brand-gold underline break-all"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
        >
          {part}
        </button>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function AnnouncementCard({ announcement, index }: AnnouncementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <GlassCard
        dark
        className={announcement.priority ? 'border-l-4 border-brand-gold' : ''}
        hover={false}
      >
        <div className="flex items-start gap-3">
          <Bell size={20} className={announcement.priority ? 'text-brand-gold' : 'text-white/40'} />
          <div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <h4 className="font-semibold text-white">{announcement.title}</h4>
              {announcement.priority && (
                <span
                  className="bg-brand-gold/20 text-brand-gold rounded-full"
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  Important
                </span>
              )}
            </div>
            <p className="text-sm text-white/70 mt-1">
              {renderMessageWithLinks(announcement.message)}
            </p>
            <p className="text-xs text-white/30 mt-2">
              {new Date(announcement.published_at).toLocaleString()}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}