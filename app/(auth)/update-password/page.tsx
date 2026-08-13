// app/(auth)/update-password/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const resolvedRef = useRef(false)

  useEffect(() => {
    const markValid = () => {
      if (resolvedRef.current) return
      resolvedRef.current = true
      setValidLink(true)
      setChecking(false)
    }

    const markInvalid = () => {
      if (resolvedRef.current) return
      resolvedRef.current = true
      setChecking(false)
      setValidLink(false)
      toast.error('Invalid or expired reset link')
      router.push('/login')
    }

    // Fix #4: if there's no recovery token in the URL at all, don't make the
    // user wait out a 4-second timer for something that can never succeed.
    const hash = window.location.hash
    const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('access_token=')

    if (!hasRecoveryToken) {
      // Still check for an existing session (e.g. they're already logged in
      // and navigated here directly on purpose) before giving up.
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          markValid()
        } else {
          markInvalid()
        }
      })
      return
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        markValid()
      }
    })

    // In case the session was already established before this listener attached
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markValid()
    })

    // Grace period: give the SDK time to parse the reset-link token from the URL
    // before concluding the link is actually invalid or expired
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) markInvalid()
    }, 6000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      // Fix #3: the recovery session is already a valid full session at this
      // point — send them straight into the app instead of making them log
      // in again with the password they just set.
      toast.success('Password updated successfully!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div
          className="animate-spin rounded-full"
          style={{ width: 40, height: 40, border: '4px solid #D4AF37', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!validLink) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-black">
      <div className="w-full max-w-md">
        <div className="glass-card-dark">
          <h1 className="text-2xl font-bold text-brand-gold text-center mb-2">
            Update password
          </h1>
          <p className="text-white/60 text-sm text-center mb-4">
            Enter your new password below
          </p>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2" style={{ display: 'block' }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-gold"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-2" style={{ display: 'block' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-gold"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '13px',
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}