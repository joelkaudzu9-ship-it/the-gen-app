// components/me/CheckInScanner.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { selfCheckIn } from '@/lib/checkin'
import { GoldButton } from '@/components/ui/GoldButton'
import { X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface CheckInScannerProps {
  onSuccess: () => void
}

export function CheckInScanner({ onSuccess }: CheckInScannerProps) {
  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  useEffect(() => {
    if (open) {
      setTimeout(startScanner, 200)
    }
    return () => stopScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function startScanner() {
    if (!videoRef.current) return
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result?.data) handleScan(result.data)
        },
        {
          onDecodeError: () => {},
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )
      scannerRef.current = scanner
      await scanner.start()
    } catch (error: any) {
      console.error('Scanner error:', error)
      if (error?.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.')
      } else {
        toast.error('Could not start camera')
      }
      setOpen(false)
    }
  }

  function stopScanner() {
    try {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
      scannerRef.current = null
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
  }

  async function handleScan(data: string) {
    stopScanner()
    setProcessing(true)
    const result = await selfCheckIn(data)
    setProcessing(false)
    setOpen(false)

    if (result.success) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <>
      <GoldButton onClick={() => setOpen(true)} fullWidth>
        <Camera size={18} />
        Check In
      </GoldButton>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <button
            onClick={() => { stopScanner(); setOpen(false) }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X size={28} />
          </button>
          <p className="text-white mb-4 text-center text-sm">
            Point your camera at the check-in QR code
          </p>
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              aspectRatio: '4 / 3',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#111',
              position: 'relative',
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'contain',
              }}
              playsInline
              muted
            />
            {/* QR scanning overlay frame */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '75%',
                height: '75%',
                border: '2px solid rgba(212, 175, 55, 0.6)',
                borderRadius: '12px',
                boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
              }}
            >
              {/* Corner markers */}
              <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37', borderRadius: '4px 0 0 0' }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '3px solid #D4AF37', borderRight: '3px solid #D4AF37', borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37', borderRadius: '0 0 0 4px' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '3px solid #D4AF37', borderRight: '3px solid #D4AF37', borderRadius: '0 0 4px 0' }} />
            </div>
            {/* Center dot */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '6px',
                height: '6px',
                background: 'rgba(212, 175, 55, 0.8)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </div>
          {processing && (
            <div className="mt-4 flex items-center gap-2 text-white/70 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-gold border-t-transparent" />
              Checking you in...
            </div>
          )}
        </div>
      )}
    </>
  )
}