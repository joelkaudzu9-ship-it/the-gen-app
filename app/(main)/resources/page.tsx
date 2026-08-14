// app/(main)/resources/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FileText, Download, Book, Calendar, Upload, Trash2, Edit2 } from 'lucide-react'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #1A1A1A, #0A0A0A)'

interface Resource {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: string
  day: number
  created_at: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDay, setUploadDay] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  useEffect(() => {
    fetchResources()
    checkAdminStatus()
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
      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('role')
          .eq('user_id', user.id)
          .single()
        setIsAdmin(participant?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadTitle || !uploadDescription || !uploadFile) {
      toast.error('Please fill in all fields and select a file')
      return
    }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `resources/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath)

      // Save to database
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          file_url: urlData.publicUrl,
          file_type: fileExt?.toUpperCase() || 'FILE',
          file_size: `${(uploadFile.size / 1024).toFixed(0)} KB`,
          day: uploadDay,
          uploaded_by: user.id,
        })

      if (dbError) throw dbError

      toast.success('Resource uploaded successfully!')
      setUploadTitle('')
      setUploadDescription('')
      setUploadFile(null)
      setUploadDay(1)
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

  async function handleEdit(resource: Resource) {
    setEditingResource(resource)
    setUploadTitle(resource.title)
    setUploadDescription(resource.description)
    setUploadDay(resource.day)
    setShowUpload(true)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingResource) return

    setUploading(true)
    try {
      const { error } = await supabase
        .from('resources')
        .update({
          title: uploadTitle,
          description: uploadDescription,
          day: uploadDay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingResource.id)

      if (error) throw error

      toast.success('Resource updated successfully!')
      setUploadTitle('')
      setUploadDescription('')
      setUploadFile(null)
      setUploadDay(1)
      setShowUpload(false)
      setEditingResource(null)
      await fetchResources()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update resource')
    } finally {
      setUploading(false)
    }
  }

  const fileIcons: Record<string, any> = {
    PDF: FileText,
    DOC: FileText,
    DOCX: FileText,
    PNG: FileText,
    JPG: FileText,
    JPEG: FileText,
  }

  const days = [1, 2, 3, 4, 5]
  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  function getCurrentDay() {
    const startDate = new Date('2026-08-13')
    const now = new Date()
    const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(Math.max(diff + 1, 1), 5)
  }

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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          {isAdmin && (
            <button
              onClick={() => {
                setShowUpload(!showUpload)
                setEditingResource(null)
                if (!showUpload) {
                  setUploadTitle('')
                  setUploadDescription('')
                  setUploadFile(null)
                  setUploadDay(1)
                }
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
                <p className="text-white/40 text-sm">Day {getCurrentDay()} resources</p>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Upload/Edit Form */}
        {showUpload && (
          <GlassCard dark className="mb-4">
            <h3 className="text-white font-semibold mb-3">
              {editingResource ? 'Edit Resource' : 'Upload New Resource'}
            </h3>
            <form onSubmit={editingResource ? handleUpdate : handleUpload} className="space-y-3">
              <div>
                <label className="text-white/80 text-sm font-medium mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-brand-gold focus:outline-none"
                  placeholder="Resource title"
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
                  className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-brand-gold focus:outline-none"
                  placeholder="Resource description"
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
                  className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white focus:border-brand-gold focus:outline-none"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{dayNames[day - 1]}</option>
                  ))}
                </select>
              </div>

              {!editingResource && (
                <div>
                  <label className="text-white/80 text-sm font-medium mb-1 block">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold file:text-black hover:file:bg-brand-gold/80"
                    required
                  />
                </div>
              )}

              <GoldButton type="submit" loading={uploading} fullWidth>
                {editingResource ? 'Update Resource' : 'Upload Resource'}
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
              const Icon = fileIcons[resource.file_type] || FileText
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
                          <span className="text-xs text-white/30">
                            {resource.file_size}
                          </span>
                          <span className="text-xs text-brand-gold/50">
                            Day {resource.day}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={resource.file_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl hover:bg-brand-gold/10 transition-colors"
                        >
                          <Download size={18} className="text-brand-gold" />
                        </a>
                        {isAdmin && (
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