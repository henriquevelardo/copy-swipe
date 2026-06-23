'use client'

import { useState, useEffect } from 'react'
import { Product, BusinessModel, BUSINESS_MODELS, MODEL_COLORS } from '@/lib/types'

const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1'
const areaCls  = `${inputCls} resize-none leading-relaxed`

const ALL_MODELS = BUSINESS_MODELS

const EMPTY = {
  name: '', niche: '', offer: '', avatar: '',
  description: '', ingredients: '', pains: '', target_audience: '',
  models: [] as string[],
}
type FormState = typeof EMPTY

// ── Card de produto ───────────────────────────────────────────────
function ProductCard({ p, onEdit, onDelete }: { p: Product; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all flex flex-col gap-3 p-4">

      {/* Nome */}
      <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
        {p.name}
      </p>

      {/* Badges de modelo */}
      <div className="flex gap-1.5 flex-wrap">
        {(p.models ?? []).length > 0
          ? (p.models ?? []).map(m => (
              <span key={m} className={`text-xs font-medium px-2 py-0.5 rounded-full ${MODEL_COLORS[m]}`}>{m}</span>
            ))
          : <span className="text-xs text-slate-300 dark:text-slate-600 italic">Sem modelo</span>
        }
      </div>

      {/* Nicho / descrição */}
      {p.niche && (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
          {p.niche}
        </p>
      )}
      {p.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {p.description}
        </p>
      )}

      {/* Dores */}
      {p.pains && (
        <div className="flex flex-wrap gap-1">
          {p.pains.split(',').slice(0, 4).map(d => (
            <span key={d.trim()} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {d.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Público alvo */}
      {p.target_audience && (
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-1">
          👥 {p.target_audience}
        </p>
      )}

      {/* Oferta */}
      {p.offer && (
        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
          💰 {p.offer}
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-1 border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
        <button onClick={onEdit}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto">
          Editar
        </button>
        <button onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Excluir
        </button>
      </div>
    </div>
  )
}

// ── Modal de formulário ───────────────────────────────────────────
function ProductModal({
  editing, form, onClose, onSubmit, set, toggleModel,
}: {
  editing: Product | null
  form: FormState
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  set: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  toggleModel: (m: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {editing ? `Editando: ${editing.name}` : 'Novo produto'}
          </h2>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none transition-colors">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">

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
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${active ? `${MODEL_COLORS[m]} border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
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

          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">
              {editing ? 'Salvar alterações' : 'Criar produto'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
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
        <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
          <button onClick={() => setFilterModel('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === '' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            Todos
          </button>
          {ALL_MODELS.map(m => (
            <button key={m} onClick={() => setFilterModel(filterModel === m ? '' : m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === m ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={() => { setEditing(null); setForm(EMPTY); setModalOpen(true) }}
          className="ml-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors whitespace-nowrap">
          + Novo produto
        </button>
      </div>

      {/* ── Grid de cards ── */}
      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-600">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-600">
          {filterModel ? `Nenhum produto em ${filterModel}.` : 'Nenhum produto cadastrado ainda.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              p={p}
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
        />
      )}
    </div>
  )
}
