'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, BusinessModel, BUSINESS_MODELS, MODEL_COLORS } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const inputCls = 'w-full text-sm border border-line dark:border-line-dark rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40 bg-card dark:bg-card-dark text-ink dark:text-ink-dark placeholder-ink-soft/60 dark:placeholder-ink-soft-dark/60'
const labelCls = 'block tab-label text-ink-soft dark:text-ink-soft-dark mb-1'
const areaCls  = `${inputCls} resize-none leading-relaxed`

const ALL_MODELS = BUSINESS_MODELS

const EMPTY = {
  name: '', niche: '', offer: '', avatar: '',
  description: '', ingredients: '', pains: '', target_audience: '',
  models: [] as string[], image_url: '',
}
type FormState = typeof EMPTY

// ── Card de produto ───────────────────────────────────────────────
function ProductCard({ p, onOpen, onEdit, onDelete }: { p: Product; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div onClick={onOpen}
      className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark hover:border-ink-soft dark:hover:border-ink-soft-dark hover:shadow-sm transition-all flex flex-col gap-3 p-4 cursor-pointer">

      {/* Foto */}
      {p.image_url && (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-paper dark:bg-paper-dark -mt-1">
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Nome */}
      <p className="text-xs font-mono font-semibold text-ink-soft dark:text-ink-soft-dark tracking-wide">
        {p.name}
      </p>

      {/* Badges de modelo */}
      <div className="flex gap-1.5 flex-wrap">
        {(p.models ?? []).length > 0
          ? (p.models ?? []).map(m => (
              <span key={m} className={`tab-label px-2 py-0.5 rounded ${MODEL_COLORS[m]}`}>{m}</span>
            ))
          : <span className="text-xs text-ink-soft/50 dark:text-ink-soft-dark/50 italic">Sem modelo</span>
        }
      </div>

      {/* Nicho / descrição */}
      {p.niche && (
        <p className="text-sm font-medium text-ink dark:text-ink-dark leading-snug">
          {p.niche}
        </p>
      )}
      {p.description && (
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark line-clamp-2 leading-relaxed">
          {p.description}
        </p>
      )}

      {/* Dores */}
      {p.pains && (
        <div className="flex flex-wrap gap-1">
          {p.pains.split(',').slice(0, 4).map(d => (
            <span key={d.trim()} className="text-xs bg-paper dark:bg-paper-dark text-ink-soft dark:text-ink-soft-dark px-2 py-0.5 rounded">
              {d.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Público alvo */}
      {p.target_audience && (
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark leading-relaxed line-clamp-1">
          <span className="tab-label text-ink-soft/60 dark:text-ink-soft-dark/60 mr-1">Público</span>{p.target_audience}
        </p>
      )}

      {/* Oferta */}
      {p.offer && (
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark line-clamp-1">
          <span className="tab-label text-ink-soft/60 dark:text-ink-soft-dark/60 mr-1">Oferta</span>{p.offer}
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-1 border-t border-line dark:border-line-dark pt-2 mt-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit}
          className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark px-2 py-1 rounded hover:bg-paper dark:hover:bg-paper-dark transition-colors ml-auto">
          Editar
        </button>
        <button onClick={onDelete}
          className="text-xs text-accent dark:text-accent-dark hover:opacity-70 px-2 py-1 rounded transition-colors">
          Excluir
        </button>
      </div>
    </div>
  )
}

// ── Modal de formulário ───────────────────────────────────────────
function ProductModal({
  editing, form, onClose, onSubmit, set, toggleModel, setImageUrl,
}: {
  editing: Product | null
  form: FormState
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  set: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  toggleModel: (m: string) => void
  setImageUrl: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

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
    setImageUrl(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark w-full max-w-xl my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-line-dark">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">
            {editing ? `Editando: ${editing.name}` : 'Novo produto'}
          </h2>
          <button onClick={onClose}
            className="text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark text-lg leading-none transition-colors">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">

          {/* Foto */}
          <div>
            <label className={labelCls}>Foto do produto</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {form.image_url ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-paper dark:bg-paper-dark group">
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  Remover
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark text-sm hover:border-accent dark:hover:border-accent-dark hover:text-ink dark:hover:text-ink-dark transition-colors flex items-center justify-center">
                {uploading ? 'Enviando...' : '+ Adicionar foto'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nome *</label>
              <input value={form.name} onChange={set('name')} required placeholder="ex: 47 Skin" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nicho</label>
              <input value={form.niche} onChange={set('niche')} placeholder="ex: sérum anti-acne" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Modelos de negócio</label>
            <div className="flex gap-2 mt-1">
              {ALL_MODELS.map(m => {
                const active = form.models.includes(m)
                return (
                  <button key={m} type="button" onClick={() => toggleModel(m)}
                    className={`tab-label px-3 py-1.5 rounded border transition-colors ${active ? `${MODEL_COLORS[m]} border-transparent` : 'border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
                    {active ? '✓ ' : ''}{m}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>Descrição do produto</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              placeholder="O que é, como funciona, principais benefícios..." className={areaCls} />
          </div>

          <div>
            <label className={labelCls}>Ingredientes / Componentes ativos</label>
            <textarea value={form.ingredients} onChange={set('ingredients')} rows={3}
              placeholder="Retinol 0.3%, Niacinamida 5%, Ácido Hialurônico..." className={areaCls} />
          </div>

          <div>
            <label className={labelCls}>Dores que resolve</label>
            <textarea value={form.pains} onChange={set('pains')} rows={3}
              placeholder="Acne, poros abertos, manchas, pele oleosa..." className={areaCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Público alvo</label>
              <textarea value={form.target_audience} onChange={set('target_audience')} rows={2}
                placeholder="Mulheres 25-40, pele mista..." className={areaCls} />
            </div>
            <div>
              <label className={labelCls}>Avatar Non-shop</label>
              <textarea value={form.avatar} onChange={set('avatar')} rows={2}
                placeholder="Persona para conteúdo orgânico..." className={areaCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Oferta</label>
            <input value={form.offer} onChange={set('offer')} placeholder="preço, desconto, garantia, bônus..." className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-line dark:border-line-dark">
            <button type="submit"
              className="px-4 py-2 bg-ink dark:bg-ink-dark text-card dark:text-paper-dark text-sm font-medium rounded-lg hover:opacity-90 transition-colors">
              {editing ? 'Salvar alterações' : 'Criar produto'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-ink-soft dark:text-ink-soft-dark text-sm font-medium rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts]   = useState<Product[]>([])
  const [form, setForm]           = useState<FormState>(EMPTY)
  const [editing, setEditing]     = useState<Product | null>(null)
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterModel, setFilterModel] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleModel = (m: string) =>
    setForm(prev => ({
      ...prev,
      models: prev.models.includes(m) ? prev.models.filter(x => x !== m) : [...prev.models, m],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name:            form.name,
      niche:           form.niche           || null,
      offer:           form.offer           || null,
      avatar:          form.avatar          || null,
      description:     form.description     || null,
      ingredients:     form.ingredients     || null,
      pains:           form.pains           || null,
      target_audience: form.target_audience || null,
      models:          form.models,
      image_url:       form.image_url || null,
    }
    if (editing) {
      await fetch(`/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setForm(EMPTY)
    setEditing(null)
    setModalOpen(false)
    fetchProducts()
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name:            p.name,
      niche:           p.niche           ?? '',
      offer:           p.offer           ?? '',
      avatar:          p.avatar          ?? '',
      description:     p.description     ?? '',
      ingredients:     p.ingredients     ?? '',
      pains:           p.pains           ?? '',
      target_audience: p.target_audience ?? '',
      models:          p.models          ?? [],
      image_url:       p.image_url       ?? '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir produto? As copies vinculadas perderão o vínculo.')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const filtered = filterModel
    ? products.filter(p => (p.models ?? []).includes(filterModel))
    : products

  return (
    <div>
      {/* ── Barra superior ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1 bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark p-1">
          <button onClick={() => setFilterModel('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === '' ? 'bg-ink dark:bg-ink-dark text-card dark:text-paper-dark' : 'text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
            Todos
          </button>
          {ALL_MODELS.map(m => (
            <button key={m} onClick={() => setFilterModel(filterModel === m ? '' : m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === m ? 'bg-ink dark:bg-ink-dark text-card dark:text-paper-dark' : 'text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={() => { setEditing(null); setForm(EMPTY); setModalOpen(true) }}
          className="ml-auto px-4 py-2 bg-ink dark:bg-ink-dark text-card dark:text-paper-dark text-sm font-medium rounded-md hover:opacity-90 transition-colors whitespace-nowrap">
          + Novo produto
        </button>
      </div>

      {/* ── Grid de cards ── */}
      {loading ? (
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
          {filterModel ? `Nenhum produto em ${filterModel}.` : 'Nenhum produto cadastrado ainda.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              p={p}
              onOpen={() => router.push(`/products/${p.id}`)}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <ProductModal
          editing={editing}
          form={form}
          onClose={closeModal}
          onSubmit={handleSubmit}
          set={set}
          toggleModel={toggleModel}
          setImageUrl={url => setForm(p => ({ ...p, image_url: url }))}
        />
      )}
    </div>
  )
}
