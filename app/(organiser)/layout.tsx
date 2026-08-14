// app/(organiser)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogOut, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrganiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const admin = isAdmin(user.email)

      if (!admin) {
        toast.error('Access denied. Admin only.')
        router.push('/')
        return
      }

      setAuthorized(true)
    } catch (error) {
      console.error('Access denied:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div
          className="animate-spin rounded-full"
          style={{ width: 48, height: 48, border: '4px solid #D4AF37', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <div className="mx-auto p-4" style={{ maxWidth: '1280px' }}>
        {/* Header with Resources Link and Sign Out Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-gold/10" style={{ padding: '8px' }}>
              <Shield size={24} className="text-brand-gold" />
            </div>
            <h1 className="text-xl font-bold text-white">Organiser Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/resources"
              className="flex items-center gap-2 rounded-xl text-sm font-medium"
              style={{
                padding: '8px 16px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                color: '#D4AF37',
              }}
            >
              <FileText size={16} />
              Resources
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl text-sm font-medium"
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}