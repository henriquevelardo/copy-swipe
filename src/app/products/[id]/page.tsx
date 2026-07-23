'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product, Copy, MODEL_COLORS } from '@/lib/types'

function InfoBlock({ label, value, emoji }: { label: string; value: string | null; emoji?: string }) {
  if (!value) return null
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {emoji ? `${emoji} ` : ''}{label}
      </p>
      <p className="text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [copies, setCopies]   = useState<Copy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch(`/api/copies?product_id=${id}`).then(r => r.json()),
    ]).then(([p, c]) => {
      setProduct(p)
      setCopies(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-600">Carregando...</p>
  if (!product) return <p className="text-sm text-slate-400 dark:text-slate-600">Produto não encontrado.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Voltar */}
      <Link href="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
        ← Produtos
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {product.image_url && (
          <div className="w-full aspect-[21/9] bg-slate-100 dark:bg-slate-800">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{product.name}</h1>
            <div className="flex gap-1.5 flex-wrap">
              {(product.models ?? []).length > 0
                ? (product.models ?? []).map(m => (
                    <span key={m} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${MODEL_COLORS[m]}`}>{m}</span>
                  ))
                : <span className="text-xs text-slate-300 dark:text-slate-600 italic">Sem modelo definido</span>
              }
            </div>
          </div>
          <button onClick={() => router.push('/products')}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors flex-shrink-0">
            Editar produto
          </button>
        </div>
      </div>

      {/* Blocos de info, grandes e legíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoBlock label="Nicho" value={product.niche} emoji="🎯" />
        <InfoBlock label="Oferta" value={product.offer} emoji="💰" />
      </div>

      <InfoBlock label="Descrição do produto" value={product.description} emoji="📦" />
      <InfoBlock label="Ingredientes / Componentes ativos" value={product.ingredients} emoji="🧪" />
      <InfoBlock label="Dores que resolve" value={product.pains} emoji="⚡" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoBlock label="Público alvo" value={product.target_audience} emoji="👥" />
        <InfoBlock label="Avatar Non-shop" value={product.avatar} emoji="🎭" />
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
    </div>
  )
}
