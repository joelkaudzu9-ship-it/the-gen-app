// components/organiser/AnnouncementPublisher.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/push'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Send, Bell, Star, Edit2, Trash2, X } from 'lucide-react'

export function AnnouncementPublisher() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(false)
  const [loading, setLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20)
      if (data) setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  async function publishAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: title.trim(),
            message: message.trim(),
            priority: priority,
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('📢 Announcement updated!')
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            title: title.trim(),
            message: message.trim(),
            priority: priority,
            published_at: new Date().toISOString()
          })

        if (error) throw error
        toast.success('📢 Announcement published!')

        // Fire the push notification — only on new announcements, not edits.
        // Don't await/block the UI on this; log failures but don't fail the publish.
        sendPushNotification(
          priority ? `⭐ ${title.trim()}` : title.trim(),
          message.trim()
        ).then((result) => {
          if (!result) {
            console.error('Push notification failed to send')
            toast.error('Announcement saved, but push notification failed to send')
          }
        })
      }

      setTitle('')
      setMessage('')
      setPriority(false)
      setEditingId(null)
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Announcement deleted')
      await fetchAnnouncements()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete announcement')
    }
  }

  function editAnnouncement(announcement: any) {
    setTitle(announcement.title)
    setMessage(announcement.message)
    setPriority(announcement.priority)
    setEditingId(announcement.id)
    toast.success('Editing announcement - make changes and publish')
  }

  function cancelEdit() {
    setTitle('')
    setMessage('')
    setPriority(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Publisher Card */}
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2 text-base">
            <Send size={20} className="text-brand-gold" />
            {editingId ? 'Edit Announcement' : 'Publish Announcement'}
          </h3>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-white/40 hover:text-red-400 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={publishAnnouncement} className="space-y-4">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-brand-gold focus:outline-none transition-colors"
              placeholder="Announcement title"
              required
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-brand-gold focus:outline-none transition-colors"
              placeholder="Write your announcement..."
              rows={3}
              required
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="w-4 h-4 accent-brand-gold"
                style={{ accentColor: '#D4AF37' }}
              />
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Star size={14} className={priority ? 'text-brand-gold' : ''} />
                Priority
              </span>
            </label>
          </div>

          <GoldButton type="submit" loading={loading} fullWidth>
            <Send size={18} />
            {editingId ? 'Update Announcement' : 'Publish Announcement'}
          </GoldButton>
        </form>
      </GlassCard>

      {/* Announcements List - Expanded Full Width View */}
      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Bell size={16} className="text-brand-gold" />
          Announcements
          <span className="text-xs text-white/30 ml-1">({announcements.length})</span>
        </h4>

        {loadingAnnouncements ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full w-6 h-6 border-2 border-brand-gold border-t-transparent mx-auto" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">
            No announcements yet
          </p>
        ) : (
          <div className="space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 rounded-xl bg-white/5 border"
                style={{
                  borderColor: announcement.priority ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-white font-semibold text-base">
                        {announcement.title}
                      </h5>
                      {announcement.priority && (
                        <span className="text-xs bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-full">
                          ⭐ Priority
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm mt-2 leading-relaxed">
                      {announcement.message}
                    </p>
                    <p className="text-white/30 text-xs mt-2">
                      📅 {new Date(announcement.published_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => editAnnouncement(announcement)}
                      className="p-2 rounded-lg hover:bg-brand-gold/10 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Edit2 size={16} className="text-white/40 hover:text-brand-gold" />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} className="text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}