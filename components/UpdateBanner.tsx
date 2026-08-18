// components/UpdateBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from '@/lib/supabase'
import { APP_VERSION } from '@/lib/version'
import { Download, X } from 'lucide-react'

const DOWNLOAD_PAGE = 'https://the-gen-landing.vercel.app/'

function isOlder(current: string, latest: string) {
  const c = current.split('.').map(Number)
  const l = latest.split('.').map(Number)
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cn = c[i] || 0
    const ln = l[i] || 0
    if (cn < ln) return true
    if (cn > ln) return false
  }
  return false
}

export function UpdateBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only relevant for the native app — the web version is always
    // the latest, since Vercel redeploys instantly.
    if (!Capacitor.isNativePlatform()) return

    const checkVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('app_meta')
          .select('value')
          .eq('key', 'latest_android_version')
          .single()

        if (error || !data) return
        if (isOlder(APP_VERSION, data.value)) {
          setShow(true)
        }
      } catch (error) {
        console.error('Version check failed:', error)
      }
    }
    checkVersion()
  }, [])

  const openDownloadPage = async () => {
    try {
      await Browser.open({ url: DOWNLOAD_PAGE })
    } catch (error) {
      console.error('Failed to open download page:', error)
    }
  }

  if (!show || dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #D4AF37 0%, #B8960F 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <button
        onClick={openDownloadPage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#0A0A0A',
          fontSize: '13px',
          fontWeight: 600,
          flex: 1,
          textAlign: 'left',
        }}
      >
        <Download size={16} />
        A new version is available — tap to update
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A0A0A' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}