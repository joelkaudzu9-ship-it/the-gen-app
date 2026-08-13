// components/auth/AuthForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

const ADMIN_EMAILS = [
  'gizmokzu@gmail.com',
  'joelkaudzu9@gmail.com',
  'elshaddaimpaso@gmail.com',
]

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

interface AuthFormProps {
  mode: 'login' | 'register'
  onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetCooldown, setResetCooldown] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (resetCooldown <= 0) return
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resetCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        const admin = isAdmin(data.user?.email)

        if (admin) {
          toast.success('👋 Welcome Admin! Redirecting to dashboard...', {
            duration: 3000,
            style: { background: '#0A0A0A', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' },
          })
          setTimeout(() => { window.location.href = '/dashboard' }, 500)
          return
        }

        toast.success('Welcome back! 👋')
        onSuccess?.()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })
        if (error) throw error

        if (data.user) {
          const { error: insertError } = await supabase
            .from('participants')
            .insert({ user_id: data.user.id, full_name: fullName })
          if (insertError) throw insertError
        }

        toast.success('Account created! Please check your email to confirm. 🎉')
        setTimeout(() => { window.location.href = '/login' }, 3000)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address first')
      return
    }
    if (resetCooldown > 0) return

    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox. 📧')
      setResetCooldown(60)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card-dark">
          {/* LOGO */}
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto" style={{ marginBottom: '1rem' }}>
              {!imageError ? (
                <img
                  src="/logo-gold.png"
                  alt="THE GEN-APP Logo"
                  className="w-20 h-20"
                  style={{ objectFit: 'contain' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-gold/20 border-2 border-brand-gold flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-brand-gold">G</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-brand-gold">THE GEN-APP</h1>
            <p className="text-white/60 mt-2 text-sm">Generation Family Retreat 2026</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-white/80 text-sm font-medium mb-2" style={{ display: 'block' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-gold"
                  placeholder="Enter your full name"
                  required={mode === 'register'}
                />
              </motion.div>
            )}

            <div>
              <label className="text-white/80 text-sm font-medium mb-2" style={{ display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-gold"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 text-sm font-medium">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading || resetCooldown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: resetLoading || resetCooldown > 0 ? 'default' : 'pointer',
                      color: '#D4AF37',
                      fontSize: '13px',
                      opacity: resetLoading || resetCooldown > 0 ? 0.5 : 1,
                    }}
                  >
                    {resetLoading
                      ? 'Sending...'
                      : resetCooldown > 0
                        ? `Resend in ${resetCooldown}s`
                        : 'Forgot password?'}
                  </button>
                )}
              </div>
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

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* TOGGLE */}
          <div className="mt-4 text-center">
            <p className="text-white/40 text-sm">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => window.location.href = mode === 'login' ? '/register' : '/login'}
                className="text-brand-gold font-medium text-sm"
                style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center">
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}