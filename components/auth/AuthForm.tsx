// components/auth/AuthForm.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        const userEmail = data.user?.email
        const admin = isAdmin(userEmail)

        if (admin) {
          toast.success('👋 Welcome Admin! Redirecting to dashboard...', {
            duration: 3000,
            style: {
              background: '#0A0A0A',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            },
          })
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
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
            .insert({
              user_id: data.user.id,
              full_name: fullName,
            })

          if (insertError) throw insertError
        }

        toast.success('Account created! Please check your email to confirm. 🎉')
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <div className="bg-[#1A1A1A] rounded-3xl p-8 md:p-10 border border-[#D4AF37]/20 shadow-xl">
          {/* LOGO */}
          <div className="text-center mb-10">
            <div className="w-28 h-28 mx-auto mb-4">
              {!imageError ? (
                <img
                  src="/logo-gold.png"
                  alt="THE GEN-APP Logo"
                  width={112}
                  height={112}
                  className="w-28 h-28 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center mx-auto">
                  <span className="text-5xl font-bold text-[#D4AF37]">G</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold text-[#D4AF37]">THE GEN-APP</h1>
            <p className="text-white/60 mt-2 text-base">Generation Family Retreat 2026</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white text-base focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300 placeholder:text-white/30"
                  placeholder="Enter your full name"
                  required={mode === 'register'}
                />
              </motion.div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white text-base focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300 placeholder:text-white/30"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white text-base focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300 placeholder:text-white/30 pr-14"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#D4AF37] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#8B7500] text-black font-bold py-4 px-4 rounded-2xl hover:shadow-[0_4px_25px_rgba(212,175,55,0.35)] transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* TOGGLE */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-base">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => window.location.href = mode === 'login' ? '/register' : '/login'}
                className="text-[#D4AF37] hover:underline transition-colors font-medium text-base"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <p className="text-white/20 text-sm">
                🔐 Admin users will be redirected to the dashboard
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}