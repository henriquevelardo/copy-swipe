'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Product, Copy, BUSINESS_MODELS, MODEL_COLORS } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type FormState = {
  name: string; niche: string; offer: string; avatar: string
  description: string; ingredients: string; pains: string; target_audience: string
  models: string[]; image_url: string
}

const toForm = (p: Product): FormState => ({
  name: p.name, niche: p.niche ?? '', offer: p.offer ?? '', avatar: p.avatar ?? '',
  description: p.description ?? '', ingredients: p.ingredients ?? '', pains: p.pains ?? '',
  target_audience: p.target_audience ?? '', models: p.models ?? [], image_url: p.image_url ?? '',
})

// ── Bloco editável, auto-resize ─────────────────────────────────
function EditBlock({ label, value, onChange, emoji, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; emoji?: string; rows?: number
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {emoji ? `${emoji} ` : ''}{label}
      </p>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        rows={rows}
        className="w-full text-base text-slate-800 dark:text-slate-100 leading-relaxed bg-transparent resize-none focus:outline-none placeholder-slate-300 dark:placeholder-slate-600"
      />
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [form, setForm]       = useState<FormState | null>(null)
  const [copies, setCopies]   = useState<Copy[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [dirty, setDirty]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch(`/api/copies?product_id=${id}`).then(r => r.json()),
    ]).then(([p, c]) => {
      setProduct(p)
      setForm(toForm(p))
      setCopies(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [id])

  const update = useCallback((patch: Partial<FormState>) => {
    setForm(f => f ? { ...f, ...patch } : f)
    setDirty(true)
  }, [])

  const toggleModel = (m: string) => {
    setForm(f => {
      if (!f) return f
      const models = f.models.includes(m) ? f.models.filter(x => x !== m) : [...f.models, m]
      return { ...f, models }
    })
    setDirty(true)
  }

  const handleFile = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) {
      alert(`Erro ao enviar imagem: ${error.message}`)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    update({ image_url: data.publicUrl })
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form || !id) return
    setSaving(true)
    const payload = {
      name: form.name,
      niche: form.niche || null,
      offer: form.offer || null,
      avatar: form.avatar || null,
      description: form.description || null,
      ingredients: form.ingredients || null,
      pains: form.pains || null,
      target_audience: form.target_audience || null,
      models: form.models,
      image_url: form.image_url || null,
    }
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    setProduct(updated)
    setSaving(false)
    setDirty(false)
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-600">Carregando...</p>
  if (!product || !form) return <p className="text-sm text-slate-400 dark:text-slate-600">Produto não encontrado.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">

      {/* Voltar */}
      <Link href="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
        ← Produtos
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {form.image_url ? (
          <div className="relative w-full aspect-[21/9] bg-slate-100 dark:bg-slate-800 group">
            <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-xs bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg font-medium hover:bg-white transition-colors">
                Trocar foto
              </button>
              <button type="button" onClick={() => update({ image_url: '' })}
                className="text-xs bg-black/60 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-black/80 transition-colors">
                Remover
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full aspect-[21/9] bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center">
            {uploading ? 'Enviando...' : '+ Adicionar foto'}
          </button>
        )}

        <div className="p-6 space-y-3">
          <input
            value={form.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="Nome do produto"
            className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none w-full placeholder-slate-300 dark:placeholder-slate-600"
          />
          <div className="flex gap-1.5 flex-wrap">
            {BUSINESS_MODELS.map(m => {
              const active = form.models.includes(m)
              return (
                <button key={m} type="button" onClick={() => toggleModel(m)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${active ? `${MODEL_COLORS[m]} border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {active ? '✓ ' : ''}{m}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blocos de info, grandes e legíveis — sempre editáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditBlock label="Nicho" value={form.niche} onChange={v => update({ niche: v })} emoji="🎯" rows={2} />
        <EditBlock label="Oferta" value={form.offer} onChange={v => update({ offer: v })} emoji="💰" rows={2} />
      </div>

      <EditBlock label="Descrição do produto" value={form.description} onChange={v => update({ description: v })} emoji="📦" rows={4} />
      <EditBlock label="Ingredientes / Componentes ativos" value={form.ingredients} onChange={v => update({ ingredients: v })} emoji="🧪" rows={3} />
      <EditBlock label="Dores que resolve" value={form.pains} onChange={v => update({ pains: v })} emoji="⚡" rows={3} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditBlock label="Público alvo" value={form.target_audience} onChange={v => update({ target_audience: v })} emoji="👥" rows={3} />
        <EditBlock label="Avatar Non-shop" value={form.avatar} onChange={v => update({ avatar: v })} emoji="🎭" rows={3} />
      </div>

      {/* Copies vinculadas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Copies deste produto
          </h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {copies.length}
          </span>
        </div>
        {copies.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-600">Nenhuma copy vinculada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {copies.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                {c.name && <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 mb-1">{c.name}</p>}
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed">{c.hook || <span className="italic text-slate-300">Sem hook</span>}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de salvar — flutuante, só aparece com mudanças */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">Alterações não salvas</span>
            <button type="button" onClick={handleSave} disabled={saving}
              className="text-sm font-semibold bg-white/15 dark:bg-slate-900/10 px-4 py-1.5 rounded-lg hover:bg-white/25 dark:hover:bg-slate-900/20 transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
