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
    ? 'bg-ink dark:bg-ink-dark border-ink dark:border-ink-dark text-card dark:text-paper-dark'
    : 'bg-card dark:bg-card-dark border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark'

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`text-xs border rounded px-2 py-0.5 focus:outline-none transition-colors truncate max-w-[130px] ${btnCls}`}
      >
        {value || '— formato —'}
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 z-[60] bg-card dark:bg-card-dark border border-line dark:border-line-dark rounded-md shadow-lg py-1 min-w-[170px]"
        >
          {/* Limpar seleção */}
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left text-xs px-3 py-1.5 text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark transition-colors">
            — formato —
          </button>

          {/* Formatos existentes */}
          {allFormats.map(f => (
            <button key={f} type="button"
              onClick={() => { onChange(f); setOpen(false) }}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-paper dark:hover:bg-paper-dark transition-colors ${value === f ? 'text-ink dark:text-ink-dark font-semibold' : 'text-ink-soft dark:text-ink-soft-dark'}`}>
              {value === f ? '✓ ' : ''}{f}
            </button>
          ))}

          {/* Adicionar novo */}
          <div className="border-t border-line dark:border-line-dark mt-1 pt-1.5 px-2 pb-1.5">
            <p className="tab-label text-ink-soft dark:text-ink-soft-dark mb-1.5 px-1">Novo formato</p>
            <div className="flex gap-1">
              <input
                type="text"
                value={newFormat}
                onChange={e => setNewFormat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
                placeholder="Nome do formato..."
                className="flex-1 text-xs border border-line dark:border-line-dark rounded px-2 py-1 bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark placeholder-ink-soft/60 dark:placeholder-ink-soft-dark/60 focus:outline-none focus:ring-1 focus:ring-accent/40 dark:focus:ring-accent-dark/40"
              />
              <button type="button" onClick={handleAdd} disabled={!newFormat.trim()}
                className="text-xs px-2.5 py-1 bg-accent dark:bg-accent-dark text-card rounded disabled:opacity-40 transition-colors font-medium">
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
