// app/(organiser)/checkin-code/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { QRCodeCanvas } from 'qrcode.react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #1A1A1A, #0A0A0A)'

function generateCode() {
  return `GENFAM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export default function CheckinCodePage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const qrWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isAdmin(user?.email)) {
        router.push('/')
        return
      }
      await fetchCode()
    } finally {
      setLoading(false)
    }
  }

  async function fetchCode() {
    const { data } = await supabase
      .from('app_meta')
      .select('value')
      .eq('key', 'checkin_code')
      .maybeSingle()
    setCode(data?.value ?? null)
  }

  async function regenerate() {
    setRegenerating(true)
    try {
      const newCode = generateCode()
      const { error } = await supabase
        .from('app_meta')
        .upsert({ key: 'checkin_code', value: newCode }, { onConflict: 'key' })
      if (error) throw error
      setCode(newCode)
      toast.success('New code generated — any previously printed/displayed QR now stops working')
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate new code')
    } finally {
      setRegenerating(false)
    }
  }

  function downloadQR() {
    const canvas = qrWrapperRef.current?.querySelector('canvas')
    if (!canvas) {
      toast.error('QR code not ready yet')
      return
    }
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = 'gen-app-checkin-qr.png'
    link.click()
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
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: 'rgba(212, 175, 55, 0.7)' }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-4">Check-in Code</h1>

        <GlassCard dark className="text-center">
          {code ? (
            <div
              ref={qrWrapperRef}
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                padding: '20px',
                borderRadius: '16px',
              }}
            >
              <QRCodeCanvas value={code} size={240} level="H" includeMargin />
            </div>
          ) : (
            <p className="text-white/40 py-8">No check-in code yet — generate one below</p>
          )}
          <p className="text-white/30 text-xs mt-4">
            Display this on a screen or print it at the entrance. Same code works for every
            day of the retreat — participants scan it from their own Me page to check
            themselves in, and it resets automatically each day.
          </p>
        </GlassCard>

        <div className="flex gap-3 mt-4">
          {code && (
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            >
              <Download size={16} />
              Download PNG
            </button>
          )}
          <GoldButton onClick={regenerate} loading={regenerating} className="flex-1">
            <RefreshCw size={16} />
            {code ? 'New Code' : 'Generate'}
          </GoldButton>
        </div>
      </div>
    </div>
  )
}