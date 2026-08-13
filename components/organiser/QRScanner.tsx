// components/organiser/QRScanner.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Camera, X, CheckCircle, AlertTriangle, Clock, CameraOff } from 'lucide-react'
import MultiQRScanner from 'multi-qr-scanner-poc'

export function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [scanResult, setScanResult] = useState<{
    participant: any
    success: boolean
    message: string
  } | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])
  const [scannerKey, setScannerKey] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    fetchRecentCheckins()
    const interval = setInterval(fetchRecentCheckins, 10000)

    return () => {
      isMounted.current = false
      clearInterval(interval)
    }
  }, [])

  const fetchRecentCheckins = async () => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*, participants(full_name, groups(name))')
        .order('scanned_at', { ascending: false })
        .limit(10)
      if (data && isMounted.current) setRecentCheckins(data)
    } catch (error) {
      console.error('Error fetching recent checkins:', error)
    }
  }

  const handleDetected = async (codes: any[]) => {
    if (!codes || codes.length === 0 || processing) return

    const detectedCode = codes[0]
    const participantId = detectedCode?.rawValue || detectedCode?.data

    if (!participantId) return

    // Stop scanning and process
    setProcessing(true)
    setScanning(false)

    await processCheckIn(participantId)

    // Resume scanning after 3 seconds
    setTimeout(() => {
      if (isMounted.current) {
        setProcessing(false)
        setScanning(true)
        setScannerKey(prev => prev + 1) // Reset scanner
      }
    }, 3000)
  }

  const processCheckIn = async (participantId: string) => {
    if (!isMounted.current) return

    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*, groups(*), transport(*)')
        .eq('id', participantId)
        .single()

      if (error || !participant) {
        setScanResult({
          participant: null,
          success: false,
          message: '❌ Participant not found'
        })
        toast.error('Participant not found')
        return
      }

      if (participant.checked_in) {
        setScanResult({
          participant,
          success: false,
          message: `⚠️ ${participant.full_name} already checked in`
        })
        toast.error(`${participant.full_name} already checked in`)
        return
      }

      const { error: updateError } = await supabase
        .from('participants')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', participant.id)

      if (updateError) throw updateError

      await supabase.from('attendance').insert({
        participant_id: participant.id,
        scanned_at: new Date().toISOString()
      })

      setScanResult({
        participant,
        success: true,
        message: `✅ ${participant.full_name} checked in!`
      })

      toast.success(`✅ ${participant.full_name} checked in!`)
      await fetchRecentCheckins()
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in')
      setScanResult({
        participant: null,
        success: false,
        message: '❌ Check-in failed. Please try again.'
      })
    }
  }

  const startScanner = () => {
    setScanning(true)
    setProcessing(false)
    setScanResult(null)
    setScannerKey(prev => prev + 1)
    toast.success('Scanner started!')
  }

  const stopScanner = () => {
    setScanning(false)
    setProcessing(false)
    toast('Scanner stopped')
  }

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.querySelector('input') as HTMLInputElement
    const id = input?.value?.trim()

    if (!id) {
      toast.error('Please enter a participant ID')
      return
    }

    await processCheckIn(id)
    form.reset()
  }

  return (
    <div className="space-y-4">
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Camera size={20} className="text-[#D4AF37]" />
            QR Scanner
          </h3>
          <div className="flex gap-2">
            {!scanning ? (
              <GoldButton onClick={startScanner} className="text-sm px-4 py-2">
                <Camera size={16} />
                Start Scanner
              </GoldButton>
            ) : (
              <button
                onClick={stopScanner}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <CameraOff size={16} />
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl bg-[#1A1A1A] min-h-[300px]">
          {scanning ? (
            <MultiQRScanner
              key={scannerKey}
              onCodesDetected={handleDetected}
              isEnabled={scanning}
              fps={15}
              facingMode="environment"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
              <Camera size={48} className="mb-3" />
              <p className="text-sm">Click "Start Scanner" to scan QR codes</p>
              <p className="text-xs mt-1 text-white/20">Position QR code in frame</p>
            </div>
          )}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#D4AF37] border-t-transparent mx-auto mb-3" />
                <p className="text-white text-sm font-medium">Processing check-in...</p>
              </div>
            </div>
          )}
        </div>

        {scanning && !processing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Scanner active - scanning for QR codes
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs mb-2">Or enter participant ID manually:</p>
          <form onSubmit={handleManualCheckIn} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter participant ID"
              className="input-gold flex-1 text-sm"
            />
            <GoldButton type="submit" className="text-sm px-4 py-2">
              Check In
            </GoldButton>
          </form>
        </div>
      </GlassCard>

      {scanResult && (
        <GlassCard
          dark
          className={scanResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}
        >
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${scanResult.success ? 'text-green-500' : 'text-red-500'}`}>
                {scanResult.message}
              </p>
              {scanResult.participant && (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-white font-medium">{scanResult.participant.full_name}</p>
                  {scanResult.participant.groups && (
                    <p className="text-white/60">Group: {scanResult.participant.groups.name}</p>
                  )}
                  {scanResult.participant.transport && (
                    <p className="text-white/60">Bus: {scanResult.participant.transport.bus_number}</p>
                  )}
                  <p className="text-white/40 text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-white/30 hover:text-white/60 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-[#D4AF37]" />
          Recent Check-ins
        </h4>
        {recentCheckins.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No check-ins yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentCheckins.map((checkin) => (
              <div key={checkin.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <div>
                  <p className="text-white text-sm font-medium">
                    {checkin.participants?.full_name || 'Unknown'}
                  </p>
                  {checkin.participants?.groups && (
                    <p className="text-white/40 text-xs">Group: {checkin.participants.groups.name}</p>
                  )}
                </div>
                <span className="text-white/30 text-xs">
                  {new Date(checkin.scanned_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}