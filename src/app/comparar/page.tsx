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
    return <span className="text-ink-soft/50 dark:text-ink-soft-dark/50 italic text-sm">— vazio —</span>
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((t, i) => {
        if (t.type === 'same') return <span key={i}>{t.word} </span>
        if (t.type === 'del')
          return <mark key={i} className="bg-accent/15 dark:bg-accent-dark/20 text-accent dark:text-accent-dark rounded px-0.5 mx-px not-italic">{t.word} </mark>
        return <mark key={i} className="bg-moss/15 dark:bg-moss-dark/20 text-moss dark:text-moss-dark rounded px-0.5 mx-px not-italic">{t.word} </mark>
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
          className={`tab-label px-2.5 py-1 rounded border transition-colors ${
            idx === i
              ? side === 'a'
                ? 'bg-accent border-accent text-card'
                : 'bg-moss border-moss text-card'
              : 'bg-card dark:bg-card-dark border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark hover:border-ink-soft'
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
        <span className="tab-label text-ink-soft dark:text-ink-soft-dark">{label}</span>
        <span className={`text-xs font-medium ${hasDiff ? 'text-amber dark:text-amber-dark' : 'text-moss dark:text-moss-dark'}`}>
          {hasDiff ? '● diferente' : '✓ idêntico'}
        </span>
      </div>

      {/* Painéis de texto puro — cada um com seu seletor independente */}
      <div className="grid grid-cols-2 gap-3">
        {/* Painel A */}
        <div className="rounded-md border border-line dark:border-line-dark overflow-hidden">
          {optionsA.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-line dark:border-line-dark bg-accent/5 dark:bg-accent-dark/5">
              <span className="text-xs text-accent dark:text-accent-dark font-bold flex-shrink-0">A</span>
              <VariantPills options={optionsA} idx={idxA} onChange={setIdxA} side="a" />
            </div>
          )}
          <div className="p-4 bg-card dark:bg-card-dark">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-ink dark:text-ink-dark">
              {textA || <span className="text-ink-soft/50 dark:text-ink-soft-dark/50 italic">— vazio —</span>}
            </p>
          </div>
        </div>

        {/* Painel B */}
        <div className="rounded-md border border-line dark:border-line-dark overflow-hidden">
          {optionsB.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-line dark:border-line-dark bg-moss/5 dark:bg-moss-dark/5">
              <span className="text-xs text-moss dark:text-moss-dark font-bold flex-shrink-0">B</span>
              <VariantPills options={optionsB} idx={idxB} onChange={setIdxB} side="b" />
            </div>
          )}
          <div className="p-4 bg-card dark:bg-card-dark">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-ink dark:text-ink-dark">
              {textB || <span className="text-ink-soft/50 dark:text-ink-soft-dark/50 italic">— vazio —</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Diff destacado — seção separada, só aparece quando há diferença */}
      {hasDiff && (
        <div className="rounded-md border border-dashed border-line dark:border-line-dark overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-paper dark:bg-paper-dark border-b border-line dark:border-line-dark">
            <span className="tab-label text-ink-soft dark:text-ink-soft-dark">Diferenças</span>
            <span className="text-xs text-ink-soft/50 dark:text-ink-soft-dark/50">
              <mark className="bg-accent/15 dark:bg-accent-dark/20 text-accent dark:text-accent-dark rounded px-1 not-italic">vermelho</mark>{' '}só em A ·{' '}
              <mark className="bg-moss/15 dark:bg-moss-dark/20 text-moss dark:text-moss-dark rounded px-1 not-italic">verde</mark>{' '}só em B
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line dark:divide-line-dark">
            <div className="p-4 bg-accent/5 dark:bg-accent-dark/5">
              <DiffText tokens={tokA} />
            </div>
            <div className="p-4 bg-moss/5 dark:bg-moss-dark/5">
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
    ? 'border-accent/40 dark:border-accent-dark/40 bg-accent/5 dark:bg-accent-dark/5'
    : 'border-moss/40 dark:border-moss-dark/40 bg-moss/5 dark:bg-moss-dark/5'
  const emptyColor = isDragOver
    ? isA ? 'border-accent bg-accent/10 dark:bg-accent-dark/15' : 'border-moss bg-moss/10 dark:bg-moss-dark/15'
    : 'border-dashed border-line dark:border-line-dark'
  const badge = isA ? 'bg-accent' : 'bg-moss'

  if (!copy) return (
    <div
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      className={`rounded-md border-2 transition-colors flex flex-col items-center justify-center gap-2 p-6 min-h-[88px] ${emptyColor}`}
    >
      <span className={`w-7 h-7 rounded-full text-card text-sm font-bold flex items-center justify-center ${badge} opacity-40`}>{label}</span>
      <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
        {isDragOver ? 'Soltar aqui' : `Arraste um card aqui (${label})`}
      </p>
    </div>
  )

  return (
    <div className={`rounded-md border-2 p-3 flex items-start gap-2 ${color}`}>
      <span className={`flex-shrink-0 w-6 h-6 rounded-full text-card text-xs font-bold flex items-center justify-center ${badge}`}>{label}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
          {copy.name || copy.hook?.slice(0, 60) || '—'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`tab-label px-1.5 py-0.5 rounded ${MODEL_COLORS[copy.business_model]}`}>
            {copy.business_model}
          </span>
          {copy.nshop_line && (
            <span className={`tab-label px-1.5 py-0.5 rounded ${copy.nshop_line === 'GMV' ? 'bg-teal/10 text-teal' : 'bg-moss/10 text-moss'}`}>
              {copy.nshop_line}
            </span>
          )}
          {copy.product && <span className="text-xs text-ink-soft dark:text-ink-soft-dark">{copy.product.name}</span>}
          {copy.tags?.slice(0, 2).map(t => (
            <span key={t} className={`tab-label px-1.5 py-0.5 rounded ${TAG_COLORS[t] ?? ''}`}>{t}</span>
          ))}
        </div>
      </div>
      <button onClick={onRemove} className="text-ink-soft/50 hover:text-accent dark:text-ink-soft-dark/50 dark:hover:text-accent-dark text-xl leading-none flex-shrink-0">×</button>
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
        'relative select-none rounded-md border bg-card dark:bg-card-dark p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all',
        isDragging ? 'opacity-40 scale-95' : '',
        isDragOver
          ? 'border-accent dark:border-accent-dark scale-[1.02]'
          : 'border-line dark:border-line-dark hover:border-ink-soft dark:hover:border-ink-soft-dark',
      ].join(' ')}
    >
      {isDragOver && (
        <div className="absolute inset-0 rounded-md bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center z-10 pointer-events-none">
          <span className="tab-label text-accent dark:text-accent-dark bg-card dark:bg-card-dark rounded px-3 py-1">⇄ Comparar</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`tab-label px-2 py-0.5 rounded ${MODEL_COLORS[copy.business_model]}`}>
          {copy.business_model}
        </span>
        {copy.nshop_line && (
          <span className={`tab-label px-1.5 py-0.5 rounded ${copy.nshop_line === 'GMV' ? 'bg-teal/10 text-teal dark:bg-teal-dark/15 dark:text-teal-dark' : 'bg-moss/10 text-moss dark:bg-moss-dark/15 dark:text-moss-dark'}`}>
            {copy.nshop_line}
          </span>
        )}
        {copy.tags?.slice(0, 1).map(tag => (
          <span key={tag} className={`tab-label px-1.5 py-0.5 rounded ${TAG_COLORS[tag] ?? ''}`}>{tag}</span>
        ))}
        {copy.name && (
          <span className="text-xs font-mono text-ink-soft dark:text-ink-soft-dark ml-auto">{copy.name}</span>
        )}
      </div>
      {copy.hook ? (
        <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-2 leading-snug">{copy.hook}</p>
      ) : (
        <p className="text-sm text-ink-soft/50 dark:text-ink-soft-dark/50 italic">Sem hook</p>
      )}
      {copy.body && (
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark line-clamp-1">{copy.body}</p>
      )}
      <p className="text-xs text-ink-soft/50 dark:text-ink-soft-dark/50 mt-auto">clique para ver · arraste para comparar</p>
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

  const selectCls = 'text-sm border border-line dark:border-line-dark rounded px-3 py-2 bg-card dark:bg-card-dark text-ink-soft dark:text-ink-soft-dark focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-ink dark:text-ink-dark">Comparar copies</h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-0.5">
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
        <div className="rounded-md border border-line dark:border-line-dark bg-card dark:bg-card-dark p-6 space-y-5">
          {/* Legenda + cabeçalhos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-card text-xs font-bold flex items-center justify-center">A</span>
              <span className="text-xs font-semibold text-ink-soft dark:text-ink-soft-dark truncate">{copyA.name || copyA.hook?.slice(0, 40) || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-moss text-card text-xs font-bold flex items-center justify-center">B</span>
              <span className="text-xs font-semibold text-ink-soft dark:text-ink-soft-dark truncate">{copyB.name || copyB.hook?.slice(0, 40) || '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-ink-soft dark:text-ink-soft-dark pb-1 border-b border-line dark:border-line-dark">
            <span className="flex items-center gap-1">
              <mark className="bg-accent/15 dark:bg-accent-dark/20 text-accent dark:text-accent-dark rounded px-1 not-italic">palavra</mark> só em A
            </span>
            <span className="flex items-center gap-1">
              <mark className="bg-moss/15 dark:bg-moss-dark/20 text-moss dark:text-moss-dark rounded px-1 not-italic">palavra</mark> só em B
            </span>
          </div>

          <BlockCompare label="Hook" optionsA={hooksA} optionsB={hooksB} />
          <BlockCompare label="Body" optionsA={copyA.body ? [copyA.body] : []} optionsB={copyB.body ? [copyB.body] : []} />
          <BlockCompare label="CTA"  optionsA={ctasA}  optionsB={ctasB} />
        </div>
      )}

      {/* ── Divisor ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line dark:bg-line-dark" />
        <span className="tab-label text-ink-soft dark:text-ink-soft-dark">
          {filtered.length} cop{filtered.length === 1 ? 'y' : 'ies'}
        </span>
        <div className="h-px flex-1 bg-line dark:bg-line-dark" />
      </div>

      {/* ── Filtros ── */}
      <div className="space-y-2">
        {/* Linha 1: modelos */}
        <div className="flex gap-1 bg-card dark:bg-card-dark border border-line dark:border-line-dark rounded-md p-1 w-fit">
          <button
            onClick={() => setFilterModel('')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterModel === '' ? 'bg-ink dark:bg-ink-dark text-card dark:text-paper-dark' : 'text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
            Todos
          </button>
          {BUSINESS_MODELS.map(m => (
            <button key={m}
              onClick={() => setFilterModel(filterModel === m ? '' : m)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterModel === m ? 'bg-ink dark:bg-ink-dark text-card dark:text-paper-dark' : 'text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Linha 2: status + produto + busca */}
        <div className="flex flex-wrap items-center gap-2">
          {COPY_TAGS.map(tag => (
            <button key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`px-2.5 py-1.5 rounded tab-label border transition-colors ${filterTag === tag ? TAG_ACTIVE_FILTER[tag] : 'bg-card dark:bg-card-dark border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
              {tag}
            </button>
          ))}
          <div className="h-5 w-px bg-line dark:bg-line-dark" />
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
              className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark transition-colors">
              × limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Grid de cards arrastáveis ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card dark:bg-card-dark rounded-md border border-line dark:border-line-dark h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-soft dark:text-ink-soft-dark">
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
