// app/(main)/resources/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { sendPushNotification } from '@/lib/push'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FileText, Download, Book, Music, Video, Link2, Trash2, Edit2, ExternalLink, ArrowLeft } from 'lucide-react'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #1A1A1A, #0A0A0A)'

interface Resource {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: string | null
  resource_type: 'file' | 'link'
  day: number
  created_at: string
}

type UploadMode = 'file' | 'link'

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [currentDay, setCurrentDay] = useState<number | null>(null)

  // Upload form state
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLinkUrl, setUploadLinkUrl] = useState('')
  const [uploadLinkLabel, setUploadLinkLabel] = useState<'Video' | 'Audio' | 'Link'>('Video')
  const [uploadDay, setUploadDay] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  useEffect(() => {
    fetchResources()
    checkAdminStatus()
    fetchCurrentDay()
  }, [])

  async function fetchResources() {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setResources(data)
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setAdmin(isAdmin(user?.email))
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  async function fetchCurrentDay() {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('coupon_settings')
        .select('day, date')
        .eq('date', todayStr)
        .maybeSingle()

      setCurrentDay(data?.day ?? null)
    } catch (error) {
      console.error('Error fetching current day:', error)
    }
  }

  function resetForm() {
    setUploadMode('file')
    setUploadTitle('')
    setUploadDescription('')
    setUploadFile(null)
    setUploadLinkUrl('')
    setUploadLinkLabel('Video')
    setUploadDay(1)
    setEditingResource(null)
  }

  async function notifyNewResource(title: string, day: number) {
    try {
      await sendPushNotification(
        '📚 New resource available',
        `${title} — Day ${day}`,
        { type: 'resource' }
      )
    } catch (error) {
      // Don't let a notification failure block the upload success flow
      console.error('Error sending resource notification:', error)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!uploadTitle || !uploadDescription) {
      toast.error('Please fill in the title and description')
      return
    }
    if (uploadMode === 'file' && !uploadFile) {
      toast.error('Please select a file')
      return
    }
    if (uploadMode === 'link' && !uploadLinkUrl.trim()) {
      toast.error('Please paste a link')
      return
    }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let fileUrl: string
      let fileType: string
      let fileSize: string | null

      if (uploadMode === 'file' && uploadFile) {
        const fileExt = uploadFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `resources/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(filePath, uploadFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('resources')
          .getPublicUrl(filePath)

        fileUrl = urlData.publicUrl
        fileType = fileExt?.toUpperCase() || 'FILE'
        fileSize = `${(uploadFile.size / 1024).toFixed(0)} KB`
      } else {
        fileUrl = uploadLinkUrl.trim()
        fileType = uploadLinkLabel
        fileSize = null
      }

      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          resource_type: uploadMode,
          day: uploadDay,
          uploaded_by: user.id,
        })

      if (dbError) throw dbError

      toast.success('Resource uploaded successfully!')
      await notifyNewResource(uploadTitle, uploadDay)

      resetForm()
      setShowUpload(false)
      await fetchResources()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload resource')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(resourceId: string) {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error

      toast.success('Resource deleted')
      await fetchResources()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete resource')
    }
  }

  function handleEdit(resource: Resource) {
    setEditingResource(resource)
    setUploadMode(resource.resource_type)
    setUploadTitle(resource.title)
    setUploadDescription(resource.description)
    setUploadDay(resource.day)
    if (resource.resource_type === 'link') {
      setUploadLinkUrl(resource.file_url)
      setUploadLinkLabel((resource.file_type as 'Video' | 'Audio' | 'Link') || 'Link')
    }
    setShowUpload(true)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingResource) return

    setUploading(true)
    try {
      const updateData: Record<string, any> = {
        title: uploadTitle,
        description: uploadDescription,
        day: uploadDay,
        updated_at: new Date().toISOString(),
      }

      // Editing a link resource lets you correct the URL/label without
      // re-uploading; file-backed resources keep their existing file
      if (editingResource.resource_type === 'link') {
        updateData.file_url = uploadLinkUrl.trim()
        updateData.file_type = uploadLinkLabel
      }

      const { error } = await supabase
        .from('resources')
        .update(updateData)
        .eq('id', editingResource.id)

      if (error) throw error

      toast.success('Resource updated successfully!')
      // Deliberately no push notification here — edits to something
      // participants may have already seen shouldn't re-notify everyone
      resetForm()
      setShowUpload(false)
      await fetchResources()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update resource')
    } finally {
      setUploading(false)
    }
  }

  function getResourceIcon(resource: Resource) {
    const type = resource.file_type?.toUpperCase() || ''
    if (resource.resource_type === 'link') {
      if (type === 'VIDEO') return Video
      if (type === 'AUDIO') return Music
      return Link2
    }
    if (['MP3', 'WAV', 'M4A', 'AAC'].includes(type)) return Music
    if (['MP4', 'MOV', 'WEBM', 'AVI'].includes(type)) return Video
    return FileText
  }

  const days = [1, 2, 3, 4, 5]
  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24" style={{ background: PAGE_BG }}>
      <div className="max-w-md mx-auto">
        {/* Back to Dashboard - Admin Only */}
        {admin && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm mb-3"
            style={{ color: 'rgba(212, 175, 55, 0.7)' }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          {admin && (
            <button
              onClick={() => {
                if (showUpload) {
                  resetForm()
                }
                setShowUpload(!showUpload)
              }}
              className="btn-gold text-sm px-4 py-2"
            >
              {showUpload ? 'Cancel' : '+ Add Resource'}
            </button>
          )}
        </div>

        {/* Today's Materials Card */}
        <AnimatedSection delay={0.1}>
          <GlassCard dark className="mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-gold/20 p-3">
                <Book size={24} className="text-brand-gold" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Today's Materials</h2>
                <p className="text-white/40 text-sm">
                  {currentDay ? `Day ${currentDay} resources` : 'Retreat has not started yet'}
                </p>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Upload/Edit Form */}
        {showUpload && (
          <GlassCard dark className="mb-4">
            <h3 className="text-white font-semibold mb-3">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h3>
            <form onSubmit={editingResource ? handleUpdate : handleUpload} className="space-y-3">

              {!editingResource && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                      uploadMode === 'file'
                        ? 'bg-brand-gold/15 border-brand-gold/60 text-brand-gold'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    Upload a file
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                      uploadMode === 'link'
                        ? 'bg-brand-gold/15 border-brand-gold/60 text-brand-gold'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    Add a link
                  </button>
                </div>
              )}

              <div>
                <label className="text-white/80 text-sm font-medium mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="input-gold"
                  placeholder="e.g. Sermon: The Road to Emmaus"
                  required
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium mb-1 block">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="input-gold"
                  placeholder="Short description"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium mb-1 block">
                  Day
                </label>
                <select
                  value={uploadDay}
                  onChange={(e) => setUploadDay(Number(e.target.value))}
                  className="input-gold"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{dayNames[day - 1]}</option>
                  ))}
                </select>
              </div>

              {uploadMode === 'file' && !editingResource && (
                <div>
                  <label className="text-white/80 text-sm font-medium mb-1 block">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-white text-sm"
                    required
                  />
                  <p className="text-white/30 text-xs mt-1">
                    PDF, doc, image, audio, or video file
                  </p>
                </div>
              )}

              {uploadMode === 'link' && (
                <>
                  <div>
                    <label className="text-white/80 text-sm font-medium mb-1 block">
                      Link type
                    </label>
                    <select
                      value={uploadLinkLabel}
                      onChange={(e) => setUploadLinkLabel(e.target.value as 'Video' | 'Audio' | 'Link')}
                      className="input-gold"
                    >
                      <option value="Video">Video (e.g. YouTube)</option>
                      <option value="Audio">Audio (e.g. sermon recording)</option>
                      <option value="Link">General link</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/80 text-sm font-medium mb-1 block">
                      URL
                    </label>
                    <input
                      type="url"
                      value={uploadLinkUrl}
                      onChange={(e) => setUploadLinkUrl(e.target.value)}
                      className="input-gold"
                      placeholder="https://..."
                      required
                    />
                  </div>
                </>
              )}

              <GoldButton type="submit" loading={uploading} fullWidth>
                {editingResource ? 'Update Resource' : 'Add Resource'}
              </GoldButton>
            </form>
          </GlassCard>
        )}

        {/* Resources List */}
        <div className="space-y-3">
          {resources.length === 0 ? (
            <GlassCard dark>
              <p className="text-white/30 text-sm text-center py-4">No resources available</p>
            </GlassCard>
          ) : (
            resources.map((resource, index) => {
              const Icon = getResourceIcon(resource)
              const isLink = resource.resource_type === 'link'

              return (
                <AnimatedSection key={resource.id} delay={0.1 + index * 0.05}>
                  <GlassCard dark hover>
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-brand-gold/10 p-2">
                        <Icon size={20} className="text-brand-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{resource.title}</h3>
                        <p className="text-white/40 text-sm truncate">{resource.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                            {resource.file_type}
                          </span>
                          {resource.file_size && (
                            <span className="text-xs text-white/30">
                              {resource.file_size}
                            </span>
                          )}
                          <span className="text-xs text-brand-gold/50">
                            Day {resource.day}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={resource.file_url}
                          {...(isLink
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : { download: true, target: '_blank', rel: 'noopener noreferrer' })}
                          className="p-2 rounded-xl hover:bg-brand-gold/10 transition-colors"
                        >
                          {isLink ? (
                            <ExternalLink size={18} className="text-brand-gold" />
                          ) : (
                            <Download size={18} className="text-brand-gold" />
                          )}
                        </a>
                        {admin && (
                          <>
                            <button
                              onClick={() => handleEdit(resource)}
                              className="p-2 rounded-xl hover:bg-brand-gold/10 transition-colors"
                            >
                              <Edit2 size={16} className="text-white/40 hover:text-brand-gold" />
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={16} className="text-white/30 hover:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </AnimatedSection>
              )
            })
          )}
        </div>

        <AnimatedSection delay={0.4}>
          <p className="text-white/20 text-xs text-center mt-4">
            More resources will be added during the retreat
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}