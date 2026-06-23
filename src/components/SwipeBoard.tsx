'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Copy, Product, COPY_TAGS, TAG_COLORS, TAG_ACTIVE_FILTER, MODEL_COLORS, BUSINESS_MODELS } from '@/lib/types'
import { FormatSelect } from './FormatDropdown'
import CopyCard from './CopyCard'
import CopyModal from './CopyModal'

const MODELS = BUSINESS_MODELS

type ModalState = {
  mode: 'view' | 'edit' | 'create'
  copy: Copy | null
  parentId?: string
} | null

export default function SwipeBoard() {
  const [copies, setCopies] = useState<Copy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [viewParent, setViewParent] = useState<Copy | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [filterModel, setFilterModel] = useState('')
  const [filterNshopLine, setFilterNshopLine] = useState<'GMV' | 'Grow' | ''>('')
  const [filterTag, setFilterTag] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterHookFormat, setFilterHookFormat] = useState('')
  const [filterBodyFormat, setFilterBodyFormat] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const setDatePreset = (preset: 'hoje' | 'ontem' | 'semana' | 'mes') => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const today = fmt(now)
    if (preset === 'hoje') { setFilterDateFrom(today); setFilterDateTo(today) }
    else if (preset === 'ontem') {
      const y = new Date(now); y.setDate(y.getDate()-1)
      setFilterDateFrom(fmt(y)); setFilterDateTo(fmt(y))
    } else if (preset === 'semana') {
      const s = new Date(now); s.setDate(s.getDate() - s.getDay())
      setFilterDateFrom(fmt(s)); setFilterDateTo(today)
    } else if (preset === 'mes') {
      setFilterDateFrom(`${now.getFullYear()}-${pad(now.getMonth()+1)}-01`); setFilterDateTo(today)
    }
    setShowCustomDate(false)
  }

  const fetchCopies = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterModel)      p.set('business_model', filterModel)
    if (filterNshopLine)  p.set('nshop_line', filterNshopLine)
    if (filterTag)        p.set('tag', filterTag)
    if (filterProduct)    p.set('product_id', filterProduct)
    if (filterHookFormat) p.set('hook_format', filterHookFormat)
    if (filterBodyFormat) p.set('body_format', filterBodyFormat)
    if (filterDateFrom)   p.set('date_from', filterDateFrom)
    if (filterDateTo)     p.set('date_to', filterDateTo)
    if (searchDebounced)  p.set('search', searchDebounced)
    const res = await fetch(`/api/copies?${p}`)
    const data: Copy[] = await res.json()
    // Ordem padrão: publicadas mais recentes primeiro, rascunhos/sem data no fim
    data.sort((a, b) => {
      if (!a.published_at && !b.published_at) return 0
      if (!a.published_at) return 1
      if (!b.published_at) return -1
      return b.published_at.localeCompare(a.published_at)
    })
    setCopies(data)
    setLoading(false)
  }, [filterModel, filterNshopLine, filterTag, filterProduct, filterHookFormat, filterBodyFormat, filterDateFrom, filterDateTo, searchDebounced])

  useEffect(() => { fetchCopies() }, [fetchCopies])
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])

  // Agrupar copies em raízes e variações
  const { rootCopies, variationsByParent } = useMemo(() => {
    const roots: Copy[] = []
    const varMap = new Map<string, Copy[]>()
    copies.forEach(c => {
      if (!c.source_copy_id) {
        roots.push(c)
      } else {
        const arr = varMap.get(c.source_copy_id) ?? []
        arr.push(c)
        varMap.set(c.source_copy_id, arr)
      }
    })
    return { rootCopies: roots, variationsByParent: varMap }
  }, [copies])

  // Filtros secundários: exibem variações como cards separados (flat)
  const isFiltering = !!(searchDebounced || filterTag || filterProduct || filterHookFormat || filterBodyFormat)

  // Raízes filtradas pelo modelo selecionado
  const filteredRoots = filterModel
    ? rootCopies.filter(c => c.business_model === filterModel)
    : rootCopies

  // O que mostrar:
  // – dentro de uma pasta (viewParent): raiz + suas variações
  // – filtros secundários ativos: flat list
  // – padrão ou só filtro de modelo: só raízes (variações aninhadas)
  const displayedCopies = viewParent
    ? [viewParent, ...(variationsByParent.get(viewParent.id) ?? [])]
    : isFiltering
      ? copies
      : filteredRoots


  const handleDrop = async (draggedCopyId: string, targetId: string) => {
    if (draggedCopyId === targetId) return
    const target = copies.find(c => c.id === targetId)
    if (!target || target.source_copy_id) return // só raízes são drop targets

    await fetch(`/api/copies/${draggedCopyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_copy_id: targetId }),
    })
    setViewParent(null)
    fetchCopies()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta copy? Não tem como desfazer.')) return
    await fetch(`/api/copies/${id}`, { method: 'DELETE' })
    setModal(null)
    if (viewParent?.id === id) setViewParent(null)
    fetchCopies()
  }

  const handleSave = () => {
    setModal(null)
    fetchCopies()
  }

  const handlePublish = async (id: string) => {
    const copy = copies.find(c => c.id === id)
    if (!copy) return
    const newTags = (copy.tags ?? []).filter(t => t !== 'Rascunho')
    await fetch(`/api/copies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags }),
    })
    fetchCopies()
  }

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await fetch(`/api/copies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
    setCopies(prev => prev.map(c => c.id === id ? { ...c, tags } : c))
  }

  const selectCls = 'text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600'

  return (
    <div>
      {/* Filtros — linha 1: modelos + nova copy */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
          <button
            onClick={() => { setFilterModel(''); setFilterNshopLine('') }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === '' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Todos
          </button>
          {MODELS.map(m => (
            <button key={m} onClick={() => { const next = filterModel === m ? '' : m; setFilterModel(next); if (next !== 'Non-shop') setFilterNshopLine('') }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterModel === m ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Toggle grid/lista */}
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} title="Grade"
              className={`px-2 py-1 rounded text-sm transition-colors ${viewMode === 'grid' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              ⊞
            </button>
            <button onClick={() => setViewMode('list')} title="Lista"
              className={`px-2 py-1 rounded text-sm transition-colors ${viewMode === 'list' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              ☰
            </button>
          </div>
          <button
            onClick={() => setModal({ mode: 'create', copy: null })}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            + Nova copy
          </button>
        </div>
      </div>

      {/* Sub-filtro GMV/Grow — apenas quando Non-shop está ativo */}
      {filterModel === 'Non-shop' && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Sub-linha:</span>
          {(['GMV', 'Grow'] as const).map(line => (
            <button key={line}
              onClick={() => setFilterNshopLine(filterNshopLine === line ? '' : line)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filterNshopLine === line
                  ? line === 'GMV'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-teal-500 border-teal-500 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              {line}
            </button>
          ))}
          {filterNshopLine && (
            <button onClick={() => setFilterNshopLine('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-1">
              × limpar
            </button>
          )}
        </div>
      )}

      {/* Filtros — linha 2: tags + formatos + busca */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Tags de status */}
        <div className="flex gap-1.5">
          {COPY_TAGS.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterTag === tag ? TAG_ACTIVE_FILTER[tag] : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Divisor */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Produto */}
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className={selectCls}>
          <option value="">Produto</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Formato hook */}
        <FormatSelect value={filterHookFormat} onChange={setFilterHookFormat} placeholder="Formato hook" className={selectCls} />

        {/* Formato body */}
        <FormatSelect value={filterBodyFormat} onChange={setFilterBodyFormat} placeholder="Formato body" className={selectCls} />

        {/* Filtro de data de publicação */}
        <select
          value={showCustomDate ? 'personalizado' : (filterDateFrom ? (() => {
            const pad = (n: number) => String(n).padStart(2, '0')
            const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
            const now = new Date(); const today = fmt(now)
            const yest = new Date(now); yest.setDate(yest.getDate()-1)
            const weekS = new Date(now); weekS.setDate(weekS.getDate() - weekS.getDay())
            if (filterDateFrom === today && filterDateTo === today) return 'hoje'
            if (filterDateFrom === fmt(yest) && filterDateTo === fmt(yest)) return 'ontem'
            if (filterDateFrom === fmt(weekS) && filterDateTo === today) return 'semana'
            return 'personalizado'
          })() : '')}
          onChange={e => {
            const v = e.target.value
            if (v === '') { setFilterDateFrom(''); setFilterDateTo(''); setShowCustomDate(false) }
            else if (v === 'personalizado') { setShowCustomDate(true); setFilterDateFrom(''); setFilterDateTo('') }
            else { setShowCustomDate(false); setDatePreset(v as 'hoje' | 'ontem' | 'semana' | 'mes') }
          }}
          className={selectCls}
        >
          <option value="">Publicação</option>
          <option value="hoje">Hoje</option>
          <option value="ontem">Ontem</option>
          <option value="semana">Esta semana</option>
          <option value="personalizado">Personalizado...</option>
        </select>
        {showCustomDate && (
          <div className="flex items-center gap-1">
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className={`${selectCls} text-xs py-1.5 px-2 w-36`} />
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className={`${selectCls} text-xs py-1.5 px-2 w-36`} />
          </div>
        )}

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar por nome, hook, body..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 min-w-52 ${selectCls} placeholder-slate-400 dark:placeholder-slate-600`}
        />

        {/* Botão limpar filtros (aparece quando algum está ativo) */}
        {(filterTag || filterProduct || filterHookFormat || filterBodyFormat || filterDateFrom || filterDateTo || search) && (
          <button
            onClick={() => { setFilterTag(''); setFilterProduct(''); setFilterHookFormat(''); setFilterBodyFormat(''); setFilterDateFrom(''); setFilterDateTo(''); setShowCustomDate(false); setSearch('') }}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Limpar ×
          </button>
        )}
      </div>

      {/* Breadcrumb da pasta */}
      {viewParent && (
        <div className="flex items-center gap-2 mb-5 px-1">
          <button
            onClick={() => setViewParent(null)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            ← Todas as copies
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-sm">
            {viewParent.hook?.slice(0, 70) ?? '(sem hook)'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-600 ml-auto">
            {(variationsByParent.get(viewParent.id)?.length ?? 0)} variações
          </span>
        </div>
      )}

      <p className="text-sm text-slate-400 dark:text-slate-600 mb-4">
        {loading ? 'Carregando...' : (() => {
          const total = displayedCopies.length
          const label = `${total} cop${total === 1 ? 'y' : 'ies'}`
          if (!viewParent && !isFiltering && copies.length !== total) {
            const hidden = copies.length - total
            return `${label} (${hidden} variação${hidden > 1 ? 'ões' : ''} dentro das pastas)`
          }
          return label
        })()}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 h-52 animate-pulse" />
          ))}
        </div>
      ) : displayedCopies.length === 0 ? (
        <div className="text-center py-24 text-slate-400 dark:text-slate-600">
          <p className="text-lg font-medium">Nenhuma copy encontrada</p>
          <p className="text-sm mt-1">
            {isFiltering ? 'Tente ajustar os filtros' : 'Crie a primeira clicando em "+ Nova copy"'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {displayedCopies.map(copy => {
            const variations = variationsByParent.get(copy.id) ?? []
            const variationCount = variations.length
            const isVariation = !!copy.source_copy_id
            const isDragOver = dragOverId === copy.id && draggedId !== copy.id

            return (
              <div key={copy.id} className={variationCount > 0 ? 'relative pb-3 isolate' : 'relative'}>
                {variationCount > 0 && (
                  <>
                    <div className="absolute inset-x-4 top-0 bottom-0 translate-y-[7px] rounded-xl bg-slate-200 dark:bg-slate-700 -z-10" />
                    <div className="absolute inset-x-8 top-0 bottom-0 translate-y-[14px] rounded-xl bg-slate-300/60 dark:bg-slate-600/40 -z-20" />
                  </>
                )}
                <CopyCard
                  copy={copy}
                  variations={variations}
                  variationCount={variationCount}
                  isVariation={isVariation}
                  isDragOver={isDragOver}
                  onView={c => setModal({ mode: 'view', copy: c })}
                  onEdit={c => setModal({ mode: 'edit', copy: c })}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onUpdateTags={handleUpdateTags}
                  onCreateVariation={c => setModal({ mode: 'create', copy: null, parentId: c.id })}
                  onViewVariations={c => { setViewParent(c); window.scrollTo(0, 0) }}
                  onDragStart={id => setDraggedId(id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                  onDragOver={id => setDragOverId(id)}
                  onDrop={handleDrop}
                />
              </div>
            )
          })}
        </div>
      ) : (
        /* ── LISTA com expandable tree ── */
        <div className="flex flex-col gap-0.5">
          {displayedCopies.map(copy => {
            const variations = variationsByParent.get(copy.id) ?? []
            const variationCount = variations.length
            const isVariation = !!copy.source_copy_id
            const isExpanded = expandedIds.has(copy.id)
            const toggleExpand = (e: React.MouseEvent) => {
              e.stopPropagation()
              setExpandedIds(prev => {
                const next = new Set(prev)
                next.has(copy.id) ? next.delete(copy.id) : next.add(copy.id)
                return next
              })
            }

            const ListRow = ({ c, indent }: { c: Copy; indent?: boolean }) => (
              <div
                onClick={() => setModal({ mode: 'view', copy: c })}
                className={`flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${indent ? 'border-l-[3px] border-l-indigo-300 dark:border-l-indigo-600' : ''}`}
              >
                {/* Expansor (só na raiz) */}
                {!indent && (
                  <button
                    onClick={variationCount > 0 ? toggleExpand : undefined}
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                      variationCount > 0
                        ? 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer'
                        : 'text-slate-200 dark:text-slate-700 cursor-default'
                    }`}
                  >
                    {variationCount > 0 ? (isExpanded ? '▾' : '▸') : '·'}
                  </button>
                )}
                {indent && <span className="flex-shrink-0 text-xs text-indigo-400 dark:text-indigo-500 pl-1">↳</span>}

                {/* Modelo */}
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${MODEL_COLORS[c.business_model]}`}>
                  {c.business_model}
                </span>
                {c.nshop_line && (
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${c.nshop_line === 'GMV' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800/40 dark:text-blue-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-800/40 dark:text-teal-300'}`}>
                    {c.nshop_line}
                  </span>
                )}
                {c.name && (
                  <span className="flex-shrink-0 text-xs font-mono text-slate-400 dark:text-slate-500 hidden sm:block truncate max-w-[90px]">
                    {c.name}
                  </span>
                )}

                {/* Hook */}
                <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate min-w-0 font-medium">
                  {c.hook ?? <span className="text-slate-300 dark:text-slate-600 italic text-xs">Sem hook</span>}
                </p>

                {/* Body */}
                <p className="hidden lg:block w-52 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 truncate">
                  {c.body ?? ''}
                </p>

                {/* Tags */}
                <div className="flex-shrink-0 flex gap-1">
                  {c.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-slate-100 text-slate-600'}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Contador de variações na raiz (quando fechado) */}
                {!indent && variationCount > 0 && !isExpanded && (
                  <span className="flex-shrink-0 text-xs text-indigo-400 dark:text-indigo-500 font-medium whitespace-nowrap">
                    {variationCount} var.
                  </span>
                )}

                {/* Ações */}
                <div className="flex-shrink-0 flex gap-1" onClick={e => e.stopPropagation()}>
                  {c.tags?.includes('Rascunho') && (
                    <button onClick={() => handlePublish(c.id)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline px-1">
                      Publicar
                    </button>
                  )}
                  <button onClick={() => setModal({ mode: 'edit', copy: c })}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            )

            return (
              <div key={copy.id} className="flex flex-col gap-0.5">
                <ListRow c={copy} />
                {isExpanded && variations.map(v => (
                  <div key={v.id} className="pl-7">
                    <ListRow c={v} indent />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <CopyModal
          mode={modal.mode}
          copy={modal.copy}
          products={products}
          rootCopies={rootCopies}
          defaultParentId={modal.parentId}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
