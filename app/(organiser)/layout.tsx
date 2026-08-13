// app/(organiser)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Shield, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

// Local admin check function
function isAdmin(email: string | undefined): boolean {
  const ADMIN_EMAILS = [
    'gizmokzu@gmail.com',
    'joelkaudzu9@gmail.com',
    'elshaddaimpaso@gmail.com',
  ]
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Styled Sign Out Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10">
              <Shield size={24} className="text-[#D4AF37]" />
            </div>
            <h1 className="text-xl font-bold text-white">Organiser Dashboard</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300 text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}