// components/organiser/SessionManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Calendar, Clock, MapPin, User, Edit2, Trash2, X, Plus } from 'lucide-react'

interface Session {
  id: string
  day: number
  title: string
  location: string
  start_time: string
  end_time: string
  description: string
  speaker: string
}

const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(1)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [speaker, setSpeaker] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [selectedDay])

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('day', selectedDay)
        .order('start_time', { ascending: true })

      if (error) throw error
      if (data) setSessions(data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setLocation('')
    setSpeaker('')
    setDescription('')
    setStartTime('')
    setEndTime('')
    setEditingId(null)
  }

  function editSession(session: Session) {
    setTitle(session.title)
    setLocation(session.location || '')
    setSpeaker(session.speaker || '')
    setDescription(session.description || '')
    setStartTime(session.start_time.slice(11, 16))
    setEndTime(session.end_time.slice(11, 16))
    setEditingId(session.id)
  }

  async function saveSession(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !startTime || !endTime) {
      toast.error('Title, start time, and end time are required')
      return
    }

    setSaving(true)
    try {
      // Retreat dates: August 17-21, 2026
      const retreatStart = new Date('2026-08-17')
      const baseDate = new Date(retreatStart)
      baseDate.setDate(baseDate.getDate() + selectedDay - 1)
      const dateStr = baseDate.toISOString().split('T')[0]

      const sessionData = {
        day: selectedDay,
        title: title.trim(),
        location: location.trim() || null,
        speaker: speaker.trim() || null,
        description: description.trim() || null,
        start_time: `${dateStr}T${startTime}:00`,
        end_time: `${dateStr}T${endTime}:00`,
      }

      let error
      if (editingId) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editingId)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('sessions')
          .insert(sessionData)
        error = insertError
      }

      if (error) throw error

      toast.success(editingId ? '✅ Session updated!' : '✅ Session created!')
      resetForm()
      await fetchSessions()
    } catch (error: any) {
      console.error('Error saving session:', error)
      toast.error(error.message || 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('Delete this session?')) return

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Session deleted')
      await fetchSessions()
    } catch (error: any) {
      console.error('Error deleting session:', error)
      toast.error(error.message || 'Failed to delete session')
    }
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return ''
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <GlassCard dark>
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Form */}
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-brand-gold" />
            {editingId ? 'Edit Session' : 'Add Session'}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-white/40 hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={saveSession} className="space-y-3">
          <div>
            <label className="text-white/80 text-sm font-medium mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-gold"
              placeholder="Session title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/80 text-sm font-medium mb-1 block">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-gold"
                required
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-1 block">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-gold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-1 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-gold"
              placeholder="e.g., Main Hall"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-1 block">Speaker</label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="input-gold"
              placeholder="Speaker name"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-gold"
              placeholder="Session description..."
              rows={2}
            />
          </div>

          <GoldButton type="submit" loading={saving} fullWidth>
            <Plus size={16} />
            {editingId ? 'Update Session' : 'Add Session'}
          </GoldButton>
        </form>
      </GlassCard>

      {/* Sessions List */}
      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-brand-gold" />
          {dayNames[selectedDay - 1]} Sessions
          <span className="text-xs text-white/30 ml-1">({sessions.length})</span>
        </h4>

        {sessions.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No sessions for this day</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-white font-medium text-sm">{session.title}</h5>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatTime(session.start_time.slice(11, 16))} – {formatTime(session.end_time.slice(11, 16))}
                      </span>
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {session.location}
                        </span>
                      )}
                      {session.speaker && (
                        <span className="flex items-center gap-1">
                          <User size={12} /> {session.speaker}
                        </span>
                      )}
                    </div>
                    {session.description && (
                      <p className="text-white/40 text-xs mt-1">{session.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => editSession(session)}
                      className="p-1.5 rounded-lg hover:bg-brand-gold/10 transition-colors"
                    >
                      <Edit2 size={14} className="text-white/40 hover:text-brand-gold" />
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
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