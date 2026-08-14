// components/ui/BottomNav.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Calendar, User, LifeBuoy, BookOpen, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Calendar, label: 'Programme', href: '/programme' },
  { icon: Ticket, label: 'Coupons', href: '/coupons' },
  { icon: User, label: 'Me', href: '/me' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
  { icon: LifeBuoy, label: 'Help', href: '/help' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (pathname?.startsWith('/dashboard')) return null
  if (isAuthed !== true) return null

  return (
    <nav
      className="fixed left-0 right-0 z-50"
      style={{ bottom: '16px', padding: '0 16px' }}
    >
      <div
        className="max-w-md mx-auto flex justify-around items-center"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          padding: '10px 8px',
        }}
      >
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center"
              style={{ gap: '2px', padding: '6px 10px', borderRadius: '14px' }}
            >
              <motion.div whileTap={{ scale: 0.88 }} className="relative">
                <Icon
                  size={22}
                  style={{
                    color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.35)',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.5))' : 'none',
                    transition: 'color 0.25s ease, filter 0.25s ease',
                  }}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute rounded-full"
                    style={{
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      background: '#D4AF37',
                      boxShadow: '0 0 6px rgba(212, 175, 55, 0.7)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </motion.div>
              <span
                className="font-medium"
                style={{
                  fontSize: '10px',
                  color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.35)',
                  transition: 'color 0.25s ease',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}