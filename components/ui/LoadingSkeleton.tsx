// components/ui/LoadingSkeleton.tsx
'use client'

function Pulse({ width, height, radius = '0.75rem' }: { width: string; height: string; radius?: string }) {
  return (
    <div
      className="bg-brand-gold/10 animate-pulse"
      style={{ width, height, borderRadius: radius }}
    />
  )
}

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Pulse width="12rem" height="2rem" />
            <Pulse width="8rem" height="1rem" />
          </div>
          <Pulse width="5rem" height="2rem" />
        </div>

        <div className="glass-card-dark space-y-4">
          <div className="flex items-center gap-2">
            <Pulse width="12px" height="12px" radius="9999px" />
            <Pulse width="8rem" height="1rem" />
          </div>
          <Pulse width="75%" height="2rem" />
          <div className="flex gap-4">
            <Pulse width="8rem" height="1.25rem" />
            <Pulse width="8rem" height="1.25rem" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Pulse key={i} width="100%" height="6rem" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProgrammeSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <Pulse width="10rem" height="2rem" />
        <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0">
              <Pulse width="4rem" height="2.5rem" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-dark space-y-2">
            <Pulse width="75%" height="1.5rem" />
            <Pulse width="50%" height="1rem" />
            <Pulse width="33%" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MeSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="glass-card-dark text-center">
          <div style={{ margin: '0 auto' }}>
            <Pulse width="6rem" height="6rem" radius="9999px" />
          </div>
          <div style={{ margin: '1rem auto 0' }}>
            <Pulse width="10rem" height="1.5rem" />
          </div>
          <div style={{ margin: '0.5rem auto 0' }}>
            <Pulse width="8rem" height="1rem" />
          </div>
          <div style={{ margin: '1rem auto 0' }}>
            <Pulse width="8rem" height="8rem" />
          </div>
        </div>
        <div className="glass-card-dark space-y-2">
          <Pulse width="8rem" height="1.25rem" />
          <Pulse width="12rem" height="1rem" />
        </div>
      </div>
    </div>
  )
}