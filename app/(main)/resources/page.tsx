// app/(main)/resources/page.tsx
'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Book, FileText, Download } from 'lucide-react'

const resources = [
  { id: '1', title: 'Morning Bible Study', description: 'Study guide for Ephesians', type: 'PDF', icon: FileText },
  { id: '2', title: 'Speaker Notes', description: 'Notes from Pastor David', type: 'PDF', icon: FileText },
  { id: '3', title: 'Bible Study Questions', description: 'Discussion questions for groups', type: 'PDF', icon: FileText },
  { id: '4', title: 'Retreat Handbook', description: 'Complete retreat guide', type: 'PDF', icon: Book },
]

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PAGE_BG = 'linear-gradient(to bottom, #0A0A0A, #1A1A1A, #0A0A0A)'

export default function ResourcesPage() {
  return (
    <div className="min-h-screen p-4 pb-24" style={{ background: PAGE_BG }}>
      <AnimatedSection>
        <h1 className="text-2xl font-bold text-white mb-4">Resources</h1>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <GlassCard dark className="mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-gold/20" style={{ padding: '12px' }}>
              <Book size={24} className="text-brand-gold" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Today's Materials</h2>
              <p className="text-white/40 text-sm">Day {getCurrentDay()} resources</p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      <div className="space-y-3">
        {resources.map((resource, index) => (
          <AnimatedSection key={resource.id} delay={0.1 + index * 0.05}>
            <GlassCard dark hover>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-gold/10" style={{ padding: '8px' }}>
                  <resource.icon size={20} className="text-brand-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{resource.title}</h3>
                  <p className="text-white/40 text-sm">{resource.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs bg-white/10 text-white/40 rounded-full"
                    style={{ padding: '4px 8px' }}
                  >
                    {resource.type}
                  </span>
                  <button
                    className="rounded-xl"
                    style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <Download size={18} className="text-brand-gold" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.4}>
        <p className="text-white/20 text-xs text-center mt-4">
          More resources will be added during the retreat
        </p>
      </AnimatedSection>
    </div>
  )
}