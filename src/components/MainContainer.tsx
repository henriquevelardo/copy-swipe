'use client'

import { usePathname } from 'next/navigation'

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullBleed = pathname?.startsWith('/copy/')

  if (isFullBleed) {
    return <main className="flex-1 overflow-hidden">{children}</main>
  }

  return <main className="flex-1 overflow-y-auto max-w-7xl mx-auto px-6 py-6 w-full">{children}</main>
}
