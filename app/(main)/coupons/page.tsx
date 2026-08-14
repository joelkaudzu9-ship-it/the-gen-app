// app/(main)/coupons/page.tsx
'use client'

import { FoodCoupon } from '@/components/participant/FoodCoupon'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Ticket } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function CouponsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-black via-[#1A1A1A] to-brand-black p-4 pb-24">
      <AnimatedSection>
        <div className="flex items-center gap-2 mb-4">
          <Ticket size={24} className="text-brand-gold" />
          <h1 className="text-2xl font-bold text-white">My Coupons</h1>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <FoodCoupon />
      </AnimatedSection>
    </div>
  )
}