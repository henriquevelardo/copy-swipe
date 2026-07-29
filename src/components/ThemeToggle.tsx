'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="tab-label ml-auto px-2.5 py-1.5 rounded text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark hover:bg-paper dark:hover:bg-paper-dark transition-colors"
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? 'Claro' : 'Escuro'}
    </button>
  )
}
