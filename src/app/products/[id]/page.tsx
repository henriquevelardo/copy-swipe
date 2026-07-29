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
function EditBlock({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <div className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark p-5">
      <p className="tab-label text-ink-soft dark:text-ink-soft-dark mb-2">
        {label}
      </p>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        rows={rows}
        className="w-full text-base text-ink dark:text-ink-dark leading-relaxed bg-transparent resize-none focus:outline-none placeholder-ink-soft/50 dark:placeholder-ink-soft-dark/50"
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

  if (loading) return <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Carregando...</p>
  if (!product || !form) return <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Produto não encontrado.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">

      {/* Voltar */}
      <Link href="/products"
        className="inline-flex items-center gap-1 text-sm text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark transition-colors">
        ← Produtos
      </Link>

      {/* Header */}
      <div className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark overflow-hidden">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {form.image_url ? (
          <div className="relative w-full h-48 bg-paper dark:bg-paper-dark group">
            <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-xs bg-card/90 text-ink px-3 py-1.5 rounded font-medium hover:bg-card transition-colors">
                Trocar foto
              </button>
              <button type="button" onClick={() => update({ image_url: '' })}
                className="text-xs bg-ink/70 text-card px-3 py-1.5 rounded font-medium hover:bg-ink/90 transition-colors">
                Remover
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full h-20 bg-paper dark:bg-paper-dark border-b border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark text-sm hover:text-ink dark:hover:text-ink-dark transition-colors flex items-center justify-center">
            {uploading ? 'Enviando...' : '+ Adicionar foto'}
          </button>
        )}

        <div className="p-6 space-y-3">
          <input
            value={form.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="Nome do produto"
            className="text-2xl font-bold font-display text-ink dark:text-ink-dark bg-transparent focus:outline-none w-full placeholder-ink-soft/50 dark:placeholder-ink-soft-dark/50"
          />
          <div className="flex gap-1.5 flex-wrap">
            {BUSINESS_MODELS.map(m => {
              const active = form.models.includes(m)
              return (
                <button key={m} type="button" onClick={() => toggleModel(m)}
                  className={`tab-label px-2.5 py-1 rounded border transition-colors ${active ? `${MODEL_COLORS[m]} border-transparent` : 'border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
                  {active ? '✓ ' : ''}{m}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blocos de info, grandes e legíveis — sempre editáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditBlock label="Nicho" value={form.niche} onChange={v => update({ niche: v })} rows={2} />
        <EditBlock label="Oferta" value={form.offer} onChange={v => update({ offer: v })} rows={2} />
      </div>

      <EditBlock label="Descrição do produto" value={form.description} onChange={v => update({ description: v })} rows={4} />
      <EditBlock label="Ingredientes / Componentes ativos" value={form.ingredients} onChange={v => update({ ingredients: v })} rows={3} />
      <EditBlock label="Dores que resolve" value={form.pains} onChange={v => update({ pains: v })} rows={3} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditBlock label="Público alvo" value={form.target_audience} onChange={v => update({ target_audience: v })} rows={3} />
        <EditBlock label="Avatar Non-shop" value={form.avatar} onChange={v => update({ avatar: v })} rows={3} />
      </div>

      {/* Copies vinculadas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="tab-label text-ink-soft dark:text-ink-soft-dark">
            Copies deste produto
          </h2>
          <span className="text-xs bg-paper dark:bg-paper-dark text-ink-soft dark:text-ink-soft-dark px-2 py-0.5 rounded">
            {copies.length}
          </span>
        </div>
        {copies.length === 0 ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Nenhuma copy vinculada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {copies.map(c => (
              <div key={c.id} className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark p-4">
                {c.name && <p className="text-xs font-mono font-semibold text-ink-soft dark:text-ink-soft-dark mb-1">{c.name}</p>}
                <p className="text-sm text-ink dark:text-ink-dark line-clamp-3 leading-relaxed">{c.hook || <span className="italic text-ink-soft/50 dark:text-ink-soft-dark/50">Sem hook</span>}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de salvar — flutuante, só aparece com mudanças */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4">
          <div className="bg-ink dark:bg-ink-dark text-card dark:text-paper-dark rounded-md shadow-2xl px-5 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">Alterações não salvas</span>
            <button type="button" onClick={handleSave} disabled={saving}
              className="text-sm font-semibold bg-accent dark:bg-accent-dark text-card px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
