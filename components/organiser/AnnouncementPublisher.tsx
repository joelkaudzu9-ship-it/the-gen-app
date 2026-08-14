// components/organiser/AnnouncementPublisher.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { sendPushNotification } from '@/lib/onesignal'
import toast from 'react-hot-toast'
import { Send, Bell, Star, Edit2, Trash2, X } from 'lucide-react'

export function AnnouncementPublisher() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingPush, setSendingPush] = useState(false)
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
    setSendingPush(true)
    try {
      let result

      if (editingId) {
        // UPDATE existing announcement
        const { data, error } = await supabase
          .from('announcements')
          .update({
            title: title.trim(),
            message: message.trim(),
            priority: priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
          .select()
          .single()

        if (error) throw error
        result = data

        toast.success('📢 Announcement updated!')
      } else {
        // INSERT new announcement
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            title: title.trim(),
            message: message.trim(),
            priority: priority,
            published_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        result = data

        // Send push notification only for new announcements
        const pushResult = await sendPushNotification(
          title.trim(),
          message.trim(),
          { announcementId: data.id, priority }
        )

        if (pushResult?.success) {
          toast.success('📢 Announcement published! Push notification sent.')
        } else {
          toast.success('📢 Announcement published! (Push notification failed)')
        }
      }

      setTitle('')
      setMessage('')
      setPriority(false)
      setEditingId(null)
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error('Failed to save announcement')
    } finally {
      setLoading(false)
      setSendingPush(false)
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
    toast.success('Editing announcement - make changes and save')
  }

  function cancelEdit() {
    setTitle('')
    setMessage('')
    setPriority(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Send size={20} className="text-[#D4AF37]" />
            {editingId ? 'Edit Announcement' : 'Publish Announcement'}
          </h3>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-white/40 hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={publishAnnouncement} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              placeholder="Announcement title"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              placeholder="Write your announcement..."
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Star size={14} className={priority ? 'text-[#D4AF37]' : ''} />
                Priority
              </span>
            </label>
            <span className="text-xs text-white/20">
              {editingId ? 'Update announcement' : 'Will send push notification'}
            </span>
          </div>

          <GoldButton type="submit" loading={loading} fullWidth>
            <Send size={18} />
            {editingId 
              ? 'Update Announcement' 
              : sendingPush ? 'Publishing & Sending...' : 'Publish Announcement'
            }
          </GoldButton>
        </form>
      </GlassCard>

      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Bell size={16} className="text-[#D4AF37]" />
          Announcements
        </h4>

        {loadingAnnouncements ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent mx-auto" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No announcements yet</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-xl bg-white/5 border ${
                  announcement.priority ? 'border-[#D4AF37]/30' : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-white font-medium text-sm">
                      {announcement.title}
                      {announcement.priority && (
                        <span className="ml-2 text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
                          Priority
                        </span>
                      )}
                    </h5>
                    <p className="text-white/60 text-sm mt-1">{announcement.message}</p>
                    <p className="text-white/30 text-xs mt-1">
                      {new Date(announcement.published_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => editAnnouncement(announcement)}
                      className="p-1.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      <Edit2 size={14} className="text-white/40 hover:text-[#D4AF37]" />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} className="text-white/30 hover:text-red-400" />
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