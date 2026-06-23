'use client'

import { useState, useRef, useEffect } from 'react'
import { VIDEO_FORMATS } from '@/lib/types'

const STORAGE_KEY = 'copyswipe_custom_formats'

export function getCustomFormats(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export function saveCustomFormat(format: string) {
  const existing = getCustomFormats()
  if (!existing.includes(format)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, format]))
    window.dispatchEvent(new CustomEvent('copyswipe-formats-updated'))
  }
}

export function getAllFormats(): string[] {
  return [...VIDEO_FORMATS, ...getCustomFormats()]
}

// ── Dropdown de formato com suporte a adicionar novos ────────────
export function FormatDropdown({
  value, onChange, invertedStyle = false,
}: {
  value: string
  onChange: (v: string) => void
  invertedStyle?: boolean
}) {
  const [open, setOpen]           = useState(false)
  const [newFormat, setNewFormat] = useState('')
  const [allFormats, setAllFormats] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // Carrega formatos ao abrir
  useEffect(() => {
    if (open) setAllFormats(getAllFormats())
  }, [open])

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const trimmed = newFormat.trim()
    if (!trimmed || allFormats.includes(trimmed)) return
    saveCustomFormat(trimmed)
    setAllFormats(getAllFormats())
    onChange(trimmed)
    setNewFormat('')
    setOpen(false)
  }

  const btnCls = invertedStyle
    ? 'bg-slate-800 dark:bg-slate-100 border-slate-700 dark:border-slate-300 text-slate-300 dark:text-slate-600'
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`text-xs border rounded-full px-2 py-0.5 focus:outline-none transition-colors truncate max-w-[130px] ${btnCls}`}
      >
        {value || '— formato —'}
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 z-[60] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[170px]"
        >
          {/* Limpar seleção */}
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left text-xs px-3 py-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            — formato —
          </button>

          {/* Formatos existentes */}
          {allFormats.map(f => (
            <button key={f} type="button"
              onClick={() => { onChange(f); setOpen(false) }}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${value === f ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
              {value === f ? '✓ ' : ''}{f}
            </button>
          ))}

          {/* Adicionar novo */}
          <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1.5 px-2 pb-1.5">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">Novo formato</p>
            <div className="flex gap-1">
              <input
                type="text"
                value={newFormat}
                onChange={e => setNewFormat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
                placeholder="Nome do formato..."
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-500"
              />
              <button type="button" onClick={handleAdd} disabled={!newFormat.trim()}
                className="text-xs px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg disabled:opacity-40 transition-colors font-medium">
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Select simples com formatos customizados (para filtros) ───────
export function FormatSelect({
  value, onChange, placeholder, className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  const [formats, setFormats] = useState<string[]>([])

  const reload = () => setFormats(getAllFormats())

  useEffect(() => {
    reload()
    window.addEventListener('copyswipe-formats-updated', reload)
    return () => window.removeEventListener('copyswipe-formats-updated', reload)
  }, [])

  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {formats.map(f => <option key={f} value={f}>{f}</option>)}
    </select>
  )
}
