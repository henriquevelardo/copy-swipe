'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Copy, Product, MODEL_COLORS, BUSINESS_MODELS, COPY_TAGS, TAG_COLORS, TAG_ACTIVE_FILTER } from '@/lib/types'
import CopyModal from '@/components/CopyModal'

/* ══════════════════════════════════════════
   DIFF WORD-LEVEL
══════════════════════════════════════════ */
type Token = { word: string; type: 'same' | 'del' | 'ins' }

function diffWords(textA: string, textB: string): { tokA: Token[]; tokB: Token[] } {
  const wa = textA.trim().split(/\s+/).filter(Boolean)
  const wb = textB.trim().split(/\s+/).filter(Boolean)
  const n = wa.length, m = wb.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = wa[i - 1] === wb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])

  const ops: Array<'same' | 'del' | 'ins'> = []
  const opWords: string[] = []
  let i = n, j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wa[i - 1] === wb[j - 1]) {
      ops.unshift('same'); opWords.unshift(wa[i - 1]); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift('ins'); opWords.unshift(wb[j - 1]); j--
    } else {
      ops.unshift('del'); opWords.unshift(wa[i - 1]); i--
    }
  }

  const tokA: Token[] = [], tokB: Token[] = []
  ops.forEach((type, idx) => {
    const word = opWords[idx]
    if (type === 'same') { tokA.push({ word, type: 'same' }); tokB.push({ word, type: 'same' }) }
    else if (type === 'del') tokA.push({ word, type: 'del' })
    else tokB.push({ word, type: 'ins' })
  })
  return { tokA, tokB }
}

function DiffText({ tokens }: { tokens: Token[] }) {
  if (!tokens.length)
    return <span className="text-slate-300 dark:text-slate-600 italic text-sm">— vazio —</span>
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((t, i) => {
        if (t.type === 'same') return <span key={i}>{t.word} </span>
        if (t.type === 'del')
          return <mark key={i} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-0.5 mx-px not-italic">{t.word} </mark>
        return <mark key={i} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-0.5 mx-px not-italic">{t.word} </mark>
      })}
    </p>
  )
}

function VariantPills({
  options, idx, onChange, side,
}: { options: string[]; idx: number; onChange: (i: number) => void; side: 'a' | 'b' }) {
  if (options.length <= 1) return <div />
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
            idx === i
              ? side === 'a'
                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                : 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300'
          }`}
        >
          {i === 0 ? 'Principal' : `Alt ${i}`}
        </button>
      ))}
    </div>
  )
}

function BlockCompare({
  label, optionsA, optionsB,
}: { label: string; optionsA: string[]; optionsB: string[] }) {
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(0)

  const textA = optionsA[Math.min(idxA, optionsA.length - 1)] ?? ''
  const textB = optionsB[Math.min(idxB, optionsB.length - 1)] ?? ''
  const { tokA, tokB } = diffWords(textA, textB)
  const hasDiff = tokA.some(t => t.type === 'del') || tokB.some(t => t.type === 'ins')
  if (!optionsA.length && !optionsB.length) return null

  return (
    <div className="space-y-2.5">
      {/* Label + status */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-medium ${hasDiff ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {hasDiff ? '● diferente' : '✓ idêntico'}
        </span>
      </div>

      {/* Painéis de texto puro — cada um com seu seletor independente */}
      <div className="grid grid-cols-2 gap-3">
        {/* Painel A */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {optionsA.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-red-50/60 dark:bg-red-900/10">
              <span className="text-xs text-red-400 dark:text-red-500 font-bold flex-shrink-0">A</span>
              <VariantPills options={optionsA} idx={idxA} onChange={setIdxA} side="a" />
            </div>
          )}
          <div className="p-4 bg-white dark:bg-slate-900">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100">
              {textA || <span className="text-slate-300 dark:text-slate-600 italic">— vazio —</span>}
            </p>
          </div>
        </div>

        {/* Painel B */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {optionsB.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-900/10">
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-bold flex-shrink-0">B</span>
              <VariantPills options={optionsB} idx={idxB} onChange={setIdxB} side="b" />
            </div>
          )}
          <div className="p-4 bg-white dark:bg-slate-900">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100">
              {textB || <span className="text-slate-300 dark:text-slate-600 italic">— vazio —</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Diff destacado — seção separada, só aparece quando há diferença */}
      {hasDiff && (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Diferenças</span>
            <span className="text-xs text-slate-300 dark:text-slate-600">
              <mark className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-1 not-italic">vermelho</mark>{' '}só em A ·{' '}
              <mark className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-1 not-italic">verde</mark>{' '}só em B
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
            <div className="p-4 bg-red-50/30 dark:bg-red-900/5">
              <DiffText tokens={tokA} />
            </div>
            <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/5">
              <DiffText tokens={tokB} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   SLOT (A ou B) no topo
══════════════════════════════════════════ */
function CompareSlot({
  copy, label, onRemove, isDragOver, onDragOver, onDragLeave, onDrop,
}: {
  copy: Copy | null; label: 'A' | 'B'
  onRemove: () => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const isA = label === 'A'
  const color = isA
    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
  const emptyColor = isDragOver
    ? isA ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
    : 'border-dashed border-slate-200 dark:border-slate-700'
  const badge = isA ? 'bg-red-400' : 'bg-emerald-500'

  if (!copy) return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      className={`rounded-xl border-2 transition-colors flex flex-col items-center justify-center gap-2 p-6 min-h-[88px] ${emptyColor}`}
    >
      <span className={`w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center ${badge} opacity-40`}>{label}</span>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {isDragOver ? 'Soltar aqui' : `Arraste um card aqui (${label})`}
      </p>
    </div>
  )

  return (
    <div className={`rounded-xl border-2 p-3 flex items-start gap-2 ${color}`}>
      <span className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${badge}`}>{label}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {copy.name || copy.hook?.slice(0, 60) || '—'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${MODEL_COLORS[copy.business_model]}`}>
            {copy.business_model}
          </span>
          {copy.nshop_line && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${copy.nshop_line === 'GMV' ? 'bg-blue-200 text-blue-800' : 'bg-teal-100 text-teal-700'}`}>
              {copy.nshop_line}
            </span>
          )}
          {copy.product && <span className="text-xs text-slate-400">{copy.product.name}</span>}
          {copy.tags?.slice(0, 2).map(t => (
            <span key={t} className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TAG_COLORS[t] ?? ''}`}>{t}</span>
          ))}
        </div>
      </div>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 text-xl leading-none flex-shrink-0">×</button>
    </div>
  )
}

/* ══════════════════════════════════════════
   MINI CARD arrastável
══════════════════════════════════════════ */
function DraggableCard({
  copy, isDragOver, isDragging,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onView,
}: {
  copy: Copy
  isDragOver: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onView: () => void
}) {
  // Distingue click de drag: se arrastou, não abre modal
  const didDrag = useRef(false)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', copy.id); didDrag.current = true; onDragStart() }}
      onDragEnd={() => { onDragEnd(); setTimeout(() => { didDrag.current = false }, 50) }}
      onDragOver={e => { e.preventDefault(); onDragOver(e) }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => { if (!didDrag.current) onView() }}
      className={[
        'relative select-none rounded-xl border bg-white dark:bg-slate-900 p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all',
        isDragging ? 'opacity-40 scale-95' : '',
        isDragOver
          ? 'border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50 scale-[1.02] ring-2 ring-indigo-300 dark:ring-indigo-700'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
      ].join(' ')}
    >
      {isDragOver && (
        <div className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-900 rounded-full px-3 py-1 shadow">⇄ Comparar</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MODEL_COLORS[copy.business_model]}`}>
          {copy.business_model}
        </span>
        {copy.nshop_line && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${copy.nshop_line === 'GMV' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800/40 dark:text-blue-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-800/40 dark:text-teal-300'}`}>
            {copy.nshop_line}
          </span>
        )}
        {copy.tags?.slice(0, 1).map(tag => (
          <span key={tag} className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] ?? ''}`}>{tag}</span>
        ))}
        {copy.name && (
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-auto">{copy.name}</span>
        )}
      </div>
      {copy.hook ? (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{copy.hook}</p>
      ) : (
        <p className="text-sm text-slate-300 dark:text-slate-600 italic">Sem hook</p>
      )}
      {copy.body && (
        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{copy.body}</p>
      )}
      <p className="text-xs text-slate-300 dark:text-slate-600 mt-auto">clique para ver · arraste para comparar</p>
    </div>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
export default function CompararPage() {
  const [copies, setCopies] = useState<Copy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterModel, setFilterModel] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t) }, [search])

  // Slots de comparação
  const [idA, setIdA] = useState<string | null>(null)
  const [idB, setIdB] = useState<string | null>(null)

  // Modal de visualização
  const [viewCopy, setViewCopy] = useState<Copy | null>(null)

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<'a' | 'b' | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/copies').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([c, p]) => {
      setCopies(Array.isArray(c) ? c : [])
      setProducts(Array.isArray(p) ? p : [])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => copies.filter(c => {
    if (filterModel && c.business_model !== filterModel) return false
    if (filterTag && !c.tags?.includes(filterTag)) return false
    if (filterProduct && c.product_id !== filterProduct) return false
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase()
      return (c.hook ?? '').toLowerCase().includes(q) ||
             (c.name ?? '').toLowerCase().includes(q) ||
             (c.body ?? '').toLowerCase().includes(q) ||
             (c.angle ?? '').toLowerCase().includes(q)
    }
    return true
  }), [copies, filterModel, filterTag, filterProduct, searchDebounced])

  const copyA = copies.find(c => c.id === idA) ?? null
  const copyB = copies.find(c => c.id === idB) ?? null

  const placeInSlot = useCallback((id: string) => {
    if (!idA || idA === id) { setIdA(id); return }
    if (!idB || idB === id) { setIdB(id); return }
    setIdA(id)
  }, [idA, idB])

  const handleDropOnSlot = (slot: 'a' | 'b') => (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    if (slot === 'a') setIdA(id)
    else              setIdB(id)
    setDragOverSlot(null); setDraggedId(null)
  }

  const handleDropOnCard = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) { setDragOverCardId(null); return }
    setIdA(sourceId); setIdB(targetId)
    setDragOverCardId(null); setDraggedId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hooksA = copyA ? [copyA.hook ?? '', ...(copyA.extra_hooks ?? [])].filter(Boolean) : []
  const hooksB = copyB ? [copyB.hook ?? '', ...(copyB.extra_hooks ?? [])].filter(Boolean) : []
  const ctasA  = copyA ? [copyA.cta  ?? '', ...(copyA.extra_ctas  ?? [])].filter(Boolean) : []
  const ctasB  = copyB ? [copyB.cta  ?? '', ...(copyB.extra_ctas  ?? [])].filter(Boolean) : []

  const selectCls = 'text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Comparar copies</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Arraste um card em cima de outro para comparar — ou solte nos slots A / B.
        </p>
      </div>

      {/* ── Slots A e B ── */}
      <div className="grid grid-cols-2 gap-4">
        <CompareSlot
          copy={copyA} label="A"
          onRemove={() => setIdA(null)}
          isDragOver={dragOverSlot === 'a'}
          onDragOver={e => { e.preventDefault(); setDragOverSlot('a') }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={handleDropOnSlot('a')}
        />
        <CompareSlot
          copy={copyB} label="B"
          onRemove={() => setIdB(null)}
          isDragOver={dragOverSlot === 'b'}
          onDragOver={e => { e.preventDefault(); setDragOverSlot('b') }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={handleDropOnSlot('b')}
        />
      </div>

      {/* ── Diff ── */}
      {copyA && copyB && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-5">
          {/* Legenda + cabeçalhos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">A</span>
              <span className="text-xs font-semibold text-slate-500 truncate">{copyA.name || copyA.hook?.slice(0, 40) || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">B</span>
              <span className="text-xs font-semibold text-slate-500 truncate">{copyB.name || copyB.hook?.slice(0, 40) || '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <mark className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-1 not-italic">palavra</mark> só em A
            </span>
            <span className="flex items-center gap-1">
              <mark className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-1 not-italic">palavra</mark> só em B
            </span>
          </div>

          <BlockCompare label="Hook" optionsA={hooksA} optionsB={hooksB} />
          <BlockCompare label="Body" optionsA={copyA.body ? [copyA.body] : []} optionsB={copyB.body ? [copyB.body] : []} />
          <BlockCompare label="CTA"  optionsA={ctasA}  optionsB={ctasB} />
        </div>
      )}

      {/* ── Divisor ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {filtered.length} cop{filtered.length === 1 ? 'y' : 'ies'}
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* ── Filtros ── */}
      <div className="space-y-2">
        {/* Linha 1: modelos */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => setFilterModel('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === '' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            Todos
          </button>
          {BUSINESS_MODELS.map(m => (
            <button key={m}
              onClick={() => setFilterModel(filterModel === m ? '' : m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === m ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Linha 2: status + produto + busca */}
        <div className="flex flex-wrap items-center gap-2">
          {COPY_TAGS.map(tag => (
            <button key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterTag === tag ? TAG_ACTIVE_FILTER[tag] : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {tag}
            </button>
          ))}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className={selectCls}>
            <option value="">Produto</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por hook, body, nome..."
            className={`${selectCls} w-64`}
          />
          {(filterModel || filterTag || filterProduct || search) && (
            <button
              onClick={() => { setFilterModel(''); setFilterTag(''); setFilterProduct(''); setSearch('') }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              × limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Grid de cards arrastáveis ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <p className="font-medium">Nenhuma copy encontrada</p>
          <p className="text-sm mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(copy => (
            <DraggableCard
              key={copy.id}
              copy={copy}
              isDragOver={dragOverCardId === copy.id && draggedId !== copy.id}
              isDragging={draggedId === copy.id}
              onDragStart={() => setDraggedId(copy.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverCardId(null) }}
              onDragOver={e => { e.preventDefault(); if (draggedId !== copy.id) setDragOverCardId(copy.id) }}
              onDragLeave={() => setDragOverCardId(null)}
              onDrop={handleDropOnCard(copy.id)}
              onView={() => setViewCopy(copy)}
            />
          ))}
        </div>
      )}

      {viewCopy && (
        <CopyModal
          mode="view"
          copy={viewCopy}
          products={products}
          rootCopies={copies.filter(c => !c.source_copy_id)}
          onSave={() => setViewCopy(null)}
          onClose={() => setViewCopy(null)}
          onDelete={() => setViewCopy(null)}
        />
      )}
    </div>
  )
}
