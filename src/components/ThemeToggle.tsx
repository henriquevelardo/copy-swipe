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
      className="ml-auto text-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? '☀' : '☾'}
    </button>
  )
}
