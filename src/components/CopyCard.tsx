'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, TAG_COLORS, MODEL_COLORS, COPY_TAGS } from '@/lib/types'

interface Props {
  copy: Copy
  variations?: Copy[]
  variationCount?: number
  isVariation?: boolean
  isDragOver?: boolean
  onView: (copy: Copy) => void
  onEdit: (copy: Copy) => void
  onDelete: (id: string) => void
  onPublish?: (id: string) => void
  onUpdateTags?: (id: string, tags: string[]) => void
  onCreateVariation: (copy: Copy) => void
  onViewVariations?: (copy: Copy) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOver: (id: string | null) => void
  onDrop: (draggedId: string, targetId: string) => void
}

export default function CopyCard({
  copy, variations = [], variationCount = 0, isVariation, isDragOver,
  onView, onEdit, onDelete, onPublish, onUpdateTags, onCreateVariation, onViewVariations,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: Props) {
  const [carouselIdx, setCarouselIdx] = useState(-1)
  const [statusOpen, setStatusOpen]   = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusOpen) return
    const handler = (e: MouseEvent) => {
      if (!statusRef.current?.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [statusOpen])

  const total = variations.length
  const hasVariations = total > 0
  // O conteúdo exibido no card
  const active: Copy = carouselIdx >= 0 && variations[carouselIdx] ? variations[carouselIdx] : copy
  const isShowingVariation = carouselIdx >= 0

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCarouselIdx(i => (i <= -1 ? total - 1 : i - 1))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCarouselIdx(i => (i >= total - 1 ? -1 : i + 1))
  }

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', copy.id); onDragStart(copy.id) }}
      onDragEnd={onDragEnd}
      onDragOver={e => { if (!isVariation) { e.preventDefault(); onDragOver(copy.id) } }}
      onDragLeave={() => onDragOver(null)}
      onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onDrop(id, copy.id); onDragOver(null) }}
      onClick={() => onView(active)}
      className={[
        'relative bg-white dark:bg-slate-900 rounded-xl border flex flex-col gap-3 p-4 cursor-grab active:cursor-grabbing transition-all select-none',
        isDragOver
          ? 'border-indigo-400 dark:border-indigo-500 shadow-xl shadow-indigo-200/60 dark:shadow-indigo-900/50 scale-[1.03]'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
        isVariation ? 'border-l-4 border-l-indigo-300 dark:border-l-indigo-600' : '',
      ].join(' ')}
    >
      {/* Overlay de drop */}
      {isDragOver && !isVariation && (
        <div className="absolute inset-0 z-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 border-2 border-dashed border-indigo-400 dark:border-indigo-500 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
          <div className="bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl px-4 py-2 shadow-lg text-sm font-semibold flex items-center gap-2">
            <span className="text-lg">⤵</span>
            Soltar para criar variação
          </div>
        </div>
      )}

      {/* Nome / identificador */}
      {active.name && (
        <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wide -mb-1">
          {active.name}
        </p>
      )}

      {/* Indicador de variação no carrossel */}
      {isShowingVariation && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium -mb-1">↳ Variação {carouselIdx + 1}</p>
      )}
      {isVariation && !isShowingVariation && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium -mb-1">↳ Variação</p>
      )}

      {/* Modelo + nshop_line */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MODEL_COLORS[active.business_model]}`}>
          {active.business_model}
        </span>
        {active.nshop_line && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active.nshop_line === 'GMV' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800/40 dark:text-blue-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-800/40 dark:text-teal-300'}`}>
            {active.nshop_line}
          </span>
        )}
        {active.product && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto truncate max-w-[8rem]">{active.product.name}</span>
        )}
      </div>

      {/* Tags de status + botão rápido */}
      <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
        {active.tags?.map(tag => (
          <span key={tag} className={`text-xs font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-slate-100 text-slate-600'}`}>
            {tag}
          </span>
        ))}
        {onUpdateTags && (
          <div ref={statusRef} className="relative ml-auto">
            <button
              onClick={() => setStatusOpen(o => !o)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors leading-none"
              title="Mudar status"
            >
              {active.tags?.length ? '▾ status' : '+ status'}
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[130px]">
                {COPY_TAGS.map(tag => {
                  const active_ = copy.tags?.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const cur = copy.tags ?? []
                        const next = cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]
                        onUpdateTags(copy.id, next)
                      }}
                      className={`text-left text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${active_ ? TAG_COLORS[tag] : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active_ ? 'bg-current' : 'border border-slate-300 dark:border-slate-600'}`} />
                      {tag}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hook */}
      {active.hook ? (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-3 leading-snug">
          {active.hook}
        </p>
      ) : (
        <p className="text-sm text-slate-300 dark:text-slate-600 italic">Sem hook</p>
      )}

      {/* Body preview */}
      {active.body && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {active.body}
        </p>
      )}

      {/* Meta tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(active.angles?.length ? active.angles : active.angle ? [active.angle] : []).map(a => (
          <span key={a} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{a}</span>
        ))}
        {active.hook_video_format && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{active.hook_video_format}</span>}
        {active.body_video_format && active.body_video_format !== active.hook_video_format && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{active.body_video_format}</span>}
        {active.metric && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{active.metric}</span>}
        {active.published_at && (
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-medium tabular-nums" title="Data de publicação no swipe">
            pub. {new Date(active.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── Carrossel de variações ── */}
      {hasVariations && (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={prev} className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors leading-none text-xs px-0.5">‹</button>
          <div className="flex gap-0.5 items-center">
            <span className={`block rounded-full transition-all ${carouselIdx === -1 ? 'w-3 h-1.5 bg-indigo-500 dark:bg-indigo-400' : 'w-1.5 h-1.5 bg-indigo-200 dark:bg-indigo-700'}`} />
            {variations.map((_, i) => (
              <span key={i} className={`block rounded-full transition-all ${carouselIdx === i ? 'w-3 h-1.5 bg-indigo-500 dark:bg-indigo-400' : 'w-1.5 h-1.5 bg-indigo-200 dark:bg-indigo-700'}`} />
            ))}
          </div>
          <button onClick={next} className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors leading-none text-xs px-0.5">›</button>
          <span className="text-xs text-indigo-400 dark:text-indigo-500">
            {carouselIdx === -1 ? `${total} var.` : `var. ${carouselIdx + 1}/${total}`}
          </span>
          {onViewVariations && (
            <button onClick={e => { e.stopPropagation(); onViewVariations(copy) }}
              className="ml-auto text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              ver todas
            </button>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-1 border-t border-slate-100 dark:border-slate-800 pt-2" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1">
          {!isVariation && !isShowingVariation && (
            <button onClick={() => onCreateVariation(copy)}
              className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors font-medium">
              + Variação
            </button>
          )}
        </div>
        <div className="ml-auto flex gap-1">
          {active.tags?.includes('Rascunho') && onPublish && (
            <button onClick={() => onPublish(active.id)}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
              Publicar
            </button>
          )}
          <button onClick={() => onEdit(active)}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Editar
          </button>
          <button onClick={() => onDelete(active.id)}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
