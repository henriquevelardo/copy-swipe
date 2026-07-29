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
        'relative bg-card dark:bg-card-dark rounded-md border flex flex-col gap-3 p-4 cursor-grab active:cursor-grabbing transition-all select-none',
        isDragOver
          ? 'border-accent dark:border-accent-dark scale-[1.02]'
          : 'border-line dark:border-line-dark hover:border-ink-soft dark:hover:border-ink-soft-dark',
        isVariation ? 'border-l-4 border-l-teal dark:border-l-teal-dark' : '',
      ].join(' ')}
    >
      {/* Selo discreto indicando variações */}
      {hasVariations && (
        <span className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-teal dark:bg-teal-dark text-card text-[10px] font-mono font-bold border-2 border-paper dark:border-paper-dark"
          title={`${total} variaç${total > 1 ? 'ões' : 'ão'}`}>
          {total}
        </span>
      )}

      {/* Overlay de drop */}
      {isDragOver && !isVariation && (
        <div className="absolute inset-0 z-10 rounded-md bg-accent/10 dark:bg-accent-dark/10 border-2 border-dashed border-accent dark:border-accent-dark flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
          <div className="bg-accent dark:bg-accent-dark text-card rounded px-4 py-2 tab-label">
            Soltar para criar variação
          </div>
        </div>
      )}

      {/* Cabeçalho: nome + produto numa linha discreta */}
      {(active.name || active.product) && (
        <div className="flex items-center gap-2 -mb-1 min-w-0">
          {active.name && (
            <p className="font-mono text-[11px] font-semibold tracking-wide uppercase text-ink-soft dark:text-ink-soft-dark truncate">
              {active.name}
            </p>
          )}
          {active.product && (
            <span className="text-xs text-ink-soft/60 dark:text-ink-soft-dark/60 ml-auto truncate max-w-[8rem] flex-shrink-0">{active.product.name}</span>
          )}
        </div>
      )}

      {/* Indicador de variação no carrossel */}
      {isShowingVariation && (
        <p className="tab-label text-teal dark:text-teal-dark -mb-1">→ Variação {carouselIdx + 1}</p>
      )}
      {isVariation && !isShowingVariation && (
        <p className="tab-label text-teal dark:text-teal-dark -mb-1">→ Variação</p>
      )}

      {/* Modelo + status — uma única fileira */}
      <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
        <span className={`tab-label px-2 py-0.5 rounded ${MODEL_COLORS[active.business_model]}`}>
          {active.business_model}
        </span>
        {active.nshop_line && (
          <span className={`tab-label px-2 py-0.5 rounded ${active.nshop_line === 'GMV' ? 'bg-teal/10 text-teal dark:bg-teal-dark/15 dark:text-teal-dark' : 'bg-moss/10 text-moss dark:bg-moss-dark/15 dark:text-moss-dark'}`}>
            {active.nshop_line}
          </span>
        )}
        {active.tags?.map(tag => (
          <span key={tag} className={`tab-label px-2 py-0.5 rounded ${TAG_COLORS[tag] ?? 'bg-ink-soft/10 text-ink-soft'}`}>
            {tag}
          </span>
        ))}
        {onUpdateTags && (
          <div ref={statusRef} className="relative ml-auto">
            <button
              onClick={() => setStatusOpen(o => !o)}
              className="tab-label text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark px-1.5 py-0.5 rounded hover:bg-paper dark:hover:bg-paper-dark transition-colors"
              title="Mudar status"
            >
              {active.tags?.length ? '▾' : '+ status'}
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card dark:bg-card-dark border border-line dark:border-line-dark rounded-md shadow-lg p-2 flex flex-col gap-1 min-w-[130px]">
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
                      className={`text-left tab-label px-2.5 py-1.5 rounded transition-colors flex items-center gap-2 ${active_ ? TAG_COLORS[tag] : 'text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active_ ? 'bg-current' : 'border border-line dark:border-line-dark'}`} />
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
        <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-3 leading-snug">
          {active.hook}
        </p>
      ) : (
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark italic">Sem hook</p>
      )}

      {/* Body preview */}
      {active.body && (
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark line-clamp-2 leading-relaxed">
          {active.body}
        </p>
      )}

      {/* Meta — texto corrido, sem caixinhas, pra não competir visualmente com os badges */}
      {(() => {
        const angles = active.angles?.length ? active.angles : active.angle ? [active.angle] : []
        const formats = [active.hook_video_format, active.body_video_format !== active.hook_video_format ? active.body_video_format : null].filter(Boolean)
        const metaParts = [...angles, ...formats, active.metric].filter(Boolean)
        if (!metaParts.length && !active.published_at) return null
        return (
          <div className="flex items-center gap-2 text-[11px] text-ink-soft/70 dark:text-ink-soft-dark/70">
            {metaParts.length > 0 && <span className="truncate">{metaParts.join(' · ')}</span>}
            {active.published_at && (
              <span className="ml-auto flex-shrink-0 font-medium tabular-nums" title="Data de publicação no swipe">
                pub. {new Date(active.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
            )}
          </div>
        )
      })()}

      {/* ── Carrossel de variações ── */}
      {hasVariations && (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={prev} className="text-teal dark:text-teal-dark hover:opacity-70 transition-opacity leading-none text-xs px-0.5">‹</button>
          <div className="flex gap-0.5 items-center">
            <span className={`block rounded-full transition-all ${carouselIdx === -1 ? 'w-3 h-1.5 bg-teal dark:bg-teal-dark' : 'w-1.5 h-1.5 bg-teal/25 dark:bg-teal-dark/30'}`} />
            {variations.map((_, i) => (
              <span key={i} className={`block rounded-full transition-all ${carouselIdx === i ? 'w-3 h-1.5 bg-teal dark:bg-teal-dark' : 'w-1.5 h-1.5 bg-teal/25 dark:bg-teal-dark/30'}`} />
            ))}
          </div>
          <button onClick={next} className="text-teal dark:text-teal-dark hover:opacity-70 transition-opacity leading-none text-xs px-0.5">›</button>
          <span className="text-xs text-teal dark:text-teal-dark">
            {carouselIdx === -1 ? `${total} var.` : `var. ${carouselIdx + 1}/${total}`}
          </span>
          {onViewVariations && (
            <button onClick={e => { e.stopPropagation(); onViewVariations(copy) }}
              className="ml-auto text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark transition-colors">
              ver todas
            </button>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-1 border-t border-line dark:border-line-dark pt-2" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1">
          {!isVariation && !isShowingVariation && (
            <button onClick={() => onCreateVariation(copy)}
              className="text-xs text-teal dark:text-teal-dark hover:opacity-70 px-2 py-1 rounded transition-colors font-medium">
              + Variação
            </button>
          )}
        </div>
        <div className="ml-auto flex gap-1">
          {active.tags?.includes('Rascunho') && onPublish && (
            <button onClick={() => onPublish(active.id)}
              className="text-xs font-medium text-amber dark:text-amber-dark hover:opacity-70 px-2 py-1 rounded transition-colors">
              Publicar
            </button>
          )}
          <button onClick={() => onEdit(active)}
            className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark px-2 py-1 rounded hover:bg-paper dark:hover:bg-paper-dark transition-colors">
            Editar
          </button>
          <button onClick={() => onDelete(active.id)}
            className="text-xs text-accent dark:text-accent-dark hover:opacity-70 px-2 py-1 rounded transition-colors">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
