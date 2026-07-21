'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, Product, BusinessModel, NshopLine, Annotation, COPY_TAGS, TAG_COLORS, BUSINESS_MODELS, MODEL_COLORS } from '@/lib/types'
import { FormatDropdown } from './FormatDropdown'

interface Props {
  mode: 'view' | 'edit' | 'create'
  copy: Copy | null
  products: Product[]
  rootCopies?: Copy[]
  defaultParentId?: string
  onSave: () => void
  onClose: () => void
  onDelete: (id: string) => void
}

type FormData = {
  name: string; product_id: string; business_model: BusinessModel; nshop_line: NshopLine | ''
  angles: string[]; headlines: string[]; hook_type: string; structure: string
  hook: string; hook_video_format: string; extra_hooks: string[]
  body: string; body_video_format: string
  cta: string; extra_ctas: string[]
  tags: string[]; metric: string; notes: string; source_copy_id: string
}

const EMPTY: FormData = {
  name: '', product_id: '', business_model: 'TikTok Shop', nshop_line: '',
  angles: [], headlines: [], hook_type: '', structure: '',
  hook: '', hook_video_format: '', extra_hooks: [],
  body: '', body_video_format: '',
  cta: '', extra_ctas: [],
  tags: [], metric: '', notes: '', source_copy_id: '',
}


const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1'

function fieldLabel(field: string) {
  if (field === 'hook') return 'Hook'
  if (field === 'body') return 'Body'
  if (field === 'cta')  return 'CTA'
  const hm = field.match(/^hook_(\d+)$/); if (hm) return `Hook alt ${hm[1]}`
  const cm = field.match(/^cta_(\d+)$/);  if (cm) return `CTA alt ${cm[1]}`
  return field
}

/* ── Highlights de anotações ────────────────────────────────── */
function AnnotatedText({ text, annotations, field }: { text: string; annotations: Annotation[]; field: string }) {
  const fieldAnns = annotations.filter(a => a.field === field)
  if (!fieldAnns.length) return <>{text}</>
  type Seg = { text: string; idx: number | null }
  const positions: { start: number; end: number; idx: number }[] = []
  fieldAnns.forEach((ann, idx) => {
    let from = 0
    while (true) {
      const pos = text.indexOf(ann.selected_text, from)
      if (pos === -1) break
      positions.push({ start: pos, end: pos + ann.selected_text.length, idx })
      from = pos + ann.selected_text.length
    }
  })
  positions.sort((a, b) => a.start - b.start)
  const segs: Seg[] = []
  let cursor = 0
  for (const p of positions) {
    if (p.start < cursor) continue
    if (p.start > cursor) segs.push({ text: text.slice(cursor, p.start), idx: null })
    segs.push({ text: text.slice(p.start, p.end), idx: p.idx })
    cursor = p.end
  }
  if (cursor < text.length) segs.push({ text: text.slice(cursor), idx: null })
  return (
    <>
      {segs.map((seg, i) =>
        seg.idx !== null
          ? <mark key={i} className="bg-yellow-300/80 rounded-sm cursor-default">
              {seg.text}<sup className="text-yellow-800 text-[10px] font-bold ml-0.5 select-none">{seg.idx + 1}</sup>
            </mark>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  )
}

/* ── Bloco de headline ─────────────────────────────────────────── */
function HeadlineBlock({ index, value, onChange, onRemove, readOnly }: {
  index: number; value: string; onChange: (v: string) => void; onRemove: () => void; readOnly?: boolean
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Headline</span>
        {!readOnly && (
          <button type="button" onClick={onRemove}
            className="ml-auto text-slate-600 hover:text-red-400 text-sm leading-none transition-colors">×</button>
        )}
      </div>
      {readOnly ? (
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{value || <span className="italic text-slate-500">vazio</span>}</p>
      ) : (
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Escreva a headline ${index + 1}...`}
          rows={2}
          className="w-full bg-transparent text-white text-sm placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
        />
      )}
    </div>
  )
}

/* ── Seção de texto ─────────────────────────────────────────────
   O seletor de formato fica DENTRO do Section para que possamos
   estilizá-lo corretamente conforme o estado sel (invertido).
*/
function Section({
  label, value, onChange, rows = 4, placeholder,
  formatValue, onFormatChange,
  onMouseUp, annotations, annotationField,
  onRemove, alwaysEdit, defaultEditing,
  selectable, isSelected, onSelect, selectionOrder,
}: {
  label: string; value: string; onChange: (v: string) => void
  rows?: number; placeholder?: string
  formatValue?: string; onFormatChange?: (v: string) => void
  onMouseUp?: () => void
  annotations?: Annotation[]; annotationField?: string
  onRemove?: () => void
  alwaysEdit?: boolean; defaultEditing?: boolean
  selectable?: boolean; isSelected?: boolean; onSelect?: () => void
  selectionOrder?: number
}) {
  const [editing, setEditing] = useState(defaultEditing ?? false)
  const sel = selectable && isSelected
  const taRef = useRef<HTMLTextAreaElement>(null)
  const showTextarea = alwaysEdit || editing

  useEffect(() => {
    const el = taRef.current
    if (!el || !showTextarea) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value, showTextarea])

  return (
    <div className={`transition-all rounded-xl ${sel ? 'bg-slate-900 dark:bg-white p-2.5 shadow-lg' : ''}`}>

      {/* Cabeçalho compacto */}
      <div className="flex items-center gap-1.5 mb-1">
        {selectable && (
          <button type="button" onClick={onSelect}
            title={sel ? (selectionOrder != null ? `Posição ${selectionOrder} — clique para remover` : 'Selecionado') : 'Adicionar ao preview'}
            className={`flex-shrink-0 relative w-4 h-4 rounded-full border-2 transition-all ${
              sel
                ? 'border-white dark:border-slate-800 bg-white dark:bg-slate-800'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400'
            }`}>
            {sel && selectionOrder != null
              ? <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-900 dark:text-white leading-none">{selectionOrder}</span>
              : sel ? <span className="block w-1 h-1 bg-slate-900 dark:bg-white rounded-full m-auto" /> : null}
          </button>
        )}
        <span className={`text-[10px] font-bold uppercase tracking-widest ${
          sel ? 'text-white/50 dark:text-slate-500' : 'text-slate-300 dark:text-slate-600'
        }`}>{label}</span>
        {formatValue !== undefined && onFormatChange && (
          <FormatDropdown value={formatValue} onChange={onFormatChange} invertedStyle={sel} />
        )}
        {onRemove && (
          <button type="button" onClick={onRemove}
            className={`ml-auto text-sm leading-none transition-colors ${
              sel ? 'text-white/30 hover:text-red-300' : 'text-slate-300 dark:text-slate-600 hover:text-red-500'
            }`}>×</button>
        )}
      </div>

      {/* Conteúdo */}
      {showTextarea ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => { if (!alwaysEdit) setEditing(false) }}
          rows={rows}
          placeholder={placeholder}
          autoFocus={editing && !alwaysEdit}
          className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 resize-none overflow-hidden leading-relaxed ${
            sel
              ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300 placeholder-white/30 dark:placeholder-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-slate-300 dark:focus:ring-slate-600'
          }`}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          onMouseUp={onMouseUp}
          title="Clique para editar"
          className={`text-sm leading-relaxed rounded-xl p-4 whitespace-pre-wrap select-text cursor-text min-h-[3rem] transition-colors ${
            sel
              ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200'
              : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
          }`}>
          {annotations && annotationField
            ? <AnnotatedText text={value || ''} annotations={annotations} field={annotationField} />
            : (value || <span className={`italic ${sel ? 'text-white/30 dark:text-slate-400' : 'text-slate-300 dark:text-slate-500'}`}>{placeholder ?? 'Vazio'}</span>)
          }
        </p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */

export default function CopyModal({
  mode: initialMode, copy, products, rootCopies = [], defaultParentId,
  onSave, onClose, onDelete,
}: Props) {
  const isCreate  = initialMode === 'create'
  const isWriting = initialMode !== 'view'

  const [form, setForm]     = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [leftTab, setLeftTab] = useState<'copy' | 'info' | 'headlines'>('copy')
  const [pendingHeadline, setPendingHeadline] = useState<string>('')

  const [annotations, setAnnotations]       = useState<Annotation[]>([])
  const [pending, setPending]               = useState<{ field: string; selectedText: string } | null>(null)
  const [annInstruction, setAnnInstruction] = useState('')
  const [savingAnn, setSavingAnn]           = useState(false)

  const [rightTab, setRightTab]     = useState<'preview' | 'visual'>('preview')
  const [selHookIdxs, setSelHookIdxs] = useState<number[]>([0])
  const [selCtaIdx, setSelCtaIdx]     = useState(0)
  const [selBody, setSelBody]           = useState(true)
  const [copied, setCopied]         = useState(false)
  const [angleInput, setAngleInput] = useState('')

  useEffect(() => {
    if (isCreate) {
      setForm({ ...EMPTY, source_copy_id: defaultParentId ?? '' })
    } else if (copy) {
      setForm({
        name: copy.name ?? '', product_id: copy.product_id ?? '',
        business_model: copy.business_model, nshop_line: copy.nshop_line ?? '',
        angles: copy.angles?.length ? copy.angles : (copy.angle ? [copy.angle] : []),
        headlines: copy.headlines ?? [],
        hook_type: copy.hook_type ?? '', structure: copy.structure ?? '',
        hook: copy.hook ?? '', hook_video_format: copy.hook_video_format ?? '',
        extra_hooks: copy.extra_hooks ?? [],
        body: copy.body ?? '', body_video_format: copy.body_video_format ?? '',
        cta: copy.cta ?? '', extra_ctas: copy.extra_ctas ?? [],
        tags: copy.tags ?? [], metric: copy.metric ?? '', notes: copy.notes ?? '',
        source_copy_id: copy.source_copy_id ?? '',
      })
    }
  }, [isCreate, copy, defaultParentId])

  useEffect(() => {
    if (copy?.id) {
      fetch(`/api/copies/${copy.id}/annotations`)
        .then(r => r.json()).then(d => setAnnotations(Array.isArray(d) ? d : []))
        .catch(() => setAnnotations([]))
    } else setAnnotations([])
  }, [copy?.id])

  useEffect(() => {
    setSelHookIdxs([0]); setSelCtaIdx(0); setSelBody(true)
  }, [copy?.id])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleTag = (tag: string) =>
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }))

  const addExtraHook    = () => setForm(p => ({ ...p, extra_hooks: [...p.extra_hooks, ''] }))
  const updateExtraHook = (i: number, v: string) =>
    setForm(p => { const a = [...p.extra_hooks]; a[i] = v; return { ...p, extra_hooks: a } })
  const removeExtraHook = (i: number) => {
    setForm(p => ({ ...p, extra_hooks: p.extra_hooks.filter((_, j) => j !== i) }))
    // Remove o índice deletado e ajusta os índices maiores
    setSelHookIdxs(prev =>
      prev.filter(idx => idx !== i + 1).map(idx => idx > i + 1 ? idx - 1 : idx)
    )
  }

  const addExtraCta    = () => setForm(p => ({ ...p, extra_ctas: [...p.extra_ctas, ''] }))
  const updateExtraCta = (i: number, v: string) =>
    setForm(p => { const a = [...p.extra_ctas]; a[i] = v; return { ...p, extra_ctas: a } })
  const removeExtraCta = (i: number) => {
    setForm(p => ({ ...p, extra_ctas: p.extra_ctas.filter((_, j) => j !== i) }))
    if (selCtaIdx === i + 1) setSelCtaIdx(0)
    else if (selCtaIdx > i + 1) setSelCtaIdx(s => s - 1)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const payload = {
      ...form,
      name: form.name || null, product_id: form.product_id || null,
      angles: form.angles, angle: form.angles[0] || null,
      headlines: form.headlines,
      hook_type: form.hook_type || null,
      structure: form.structure || null, hook: form.hook || null,
      hook_video_format: form.hook_video_format || null,
      body: form.body || null, body_video_format: form.body_video_format || null,
      cta: form.cta || null, metric: form.metric || null,
      notes: form.notes || null, source_copy_id: form.source_copy_id || null,
      nshop_line: (form.business_model === 'Non-shop' && form.nshop_line) ? form.nshop_line : null,
    }
    const url    = isCreate ? '/api/copies' : `/api/copies/${copy!.id}`
    const method = isCreate ? 'POST' : 'PUT'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    onSave()
  }

  // Auto-muda para aba Instruções Visuais quando seleciona texto
  const handleMouseUp = (field: string) => () => {
    if (pending) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (text.length < 2) return
    setPending({ field, selectedText: text })
    setAnnInstruction('')
    setRightTab('visual')  // ← abre o painel de anotações automaticamente
  }

  const saveAnnotation = async () => {
    if (!pending || !annInstruction.trim() || !copy) return
    setSavingAnn(true)
    const isHookField = pending.field.startsWith('hook')
    const res = await fetch(`/api/copies/${copy.id}/annotations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: pending.field, selected_text: pending.selectedText,
        instruction: annInstruction.trim(),
        headline: (isHookField && pendingHeadline) ? pendingHeadline : null,
      }),
    })
    setSavingAnn(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Erro ao salvar anotação:', err)
      alert(`Erro ao salvar anotação: ${err.error ?? res.status}`)
      return
    }
    setPending(null); setAnnInstruction(''); setPendingHeadline('')
    window.getSelection()?.removeAllRanges()
    const list = await fetch(`/api/copies/${copy.id}/annotations`)
    setAnnotations(await list.json())
  }

  const deleteAnnotation = async (id: string) => {
    await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }

  const allHooks   = [form.hook, ...form.extra_hooks  ].filter(Boolean) as string[]
  const allCtas    = [form.cta,  ...form.extra_ctas   ].filter(Boolean) as string[]

  const assembledCopy = useCallback(() => {
    // Ordem de seleção dos hooks é preservada (insertion order)
    const hookParts = selHookIdxs.map(i => allHooks[i] ?? '').filter(Boolean)
    return [
      hookParts.join('\n\n'),
      selBody ? form.body : '',
      allCtas[selCtaIdx] ?? '',
    ].filter(Boolean).join('\n\n')
  }, [allHooks, allCtas, selHookIdxs, selBody, selCtaIdx, form.body])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(assembledCopy())
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const ActionBar = () => (
    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
      <button type="button" onClick={handleSubmit} disabled={saving}
        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors">
        {saving ? 'Salvando...' : isCreate ? 'Criar copy' : 'Salvar alterações'}
      </button>
      <button type="button" onClick={onClose}
        className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        Cancelar
      </button>
      {!isCreate && copy && (
        <button type="button" onClick={() => { if (confirm('Excluir esta copy?')) onDelete(copy.id) }}
          className="ml-auto px-4 py-2 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Excluir
        </button>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!isCreate && copy && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MODEL_COLORS[copy.business_model]}`}>
                {copy.business_model}
              </span>
            )}
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isCreate && defaultParentId ? 'Nova Variação' : isCreate ? 'Nova Copy' : (copy?.name ?? 'Editar Copy')}
            </h2>
            {!isCreate && copy?.source_copy_id && (
              <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">↳ Variação</span>
            )}
          </div>
          <button onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── PAINEL ESQUERDO ── */}
          <div className={`${isCreate || leftTab === 'headlines' ? 'w-full' : 'flex-1'} flex flex-col min-w-0 overflow-hidden`}>
            <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-2">
              {(['copy', 'info', 'headlines'] as const).map(tab => (
                <button key={tab} onClick={() => setLeftTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${leftTab === tab ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  {tab === 'copy' ? '✍️ Copy' : tab === 'info' ? 'ℹ️ Info' : '🗞 Headlines'}
                </button>
              ))}
            </div>

            {/* ── ABA COPY ── */}
            {leftTab === 'copy' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {!isCreate && (allHooks.length > 1 || allCtas.length > 1) && (
                  <p className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="flex-shrink-0 inline-block w-3 h-3 rounded-full bg-slate-900 dark:bg-white" />
                    Clique no círculo para selecionar/empilhar blocos no preview
                  </p>
                )}

                {/* Hook principal */}
                <Section
                  label="Hook" value={form.hook}
                  onChange={v => setForm(p => ({ ...p, hook: v }))}
                  rows={4} placeholder="O gancho principal..." alwaysEdit={isWriting}
                  formatValue={form.hook_video_format}
                  onFormatChange={v => setForm(p => ({ ...p, hook_video_format: v }))}
                  onMouseUp={handleMouseUp('hook')}
                  annotations={annotations} annotationField="hook"
                  selectable={!isCreate}
                  isSelected={selHookIdxs.includes(0)}
                  selectionOrder={selHookIdxs.includes(0) ? selHookIdxs.indexOf(0) + 1 : undefined}
                  onSelect={() => setSelHookIdxs(prev =>
                    prev.includes(0) ? prev.filter(i => i !== 0) : [...prev, 0]
                  )}
                />

                {/* Hooks alternativos */}
                {form.extra_hooks.map((h, i) => (
                  <Section key={i}
                    label={`Hook alternativo ${i + 1}`}
                    value={h} onChange={v => updateExtraHook(i, v)}
                    rows={3} placeholder={`Hook alternativo ${i + 1}...`}
                    alwaysEdit={isWriting} defaultEditing={!h}
                    onRemove={() => removeExtraHook(i)}
                    onMouseUp={handleMouseUp(`hook_${i + 1}`)}
                    annotations={annotations} annotationField={`hook_${i + 1}`}
                    selectable={!isCreate}
                    isSelected={selHookIdxs.includes(i + 1)}
                    selectionOrder={selHookIdxs.includes(i + 1) ? selHookIdxs.indexOf(i + 1) + 1 : undefined}
                    onSelect={() => setSelHookIdxs(prev =>
                      prev.includes(i + 1) ? prev.filter(j => j !== i + 1) : [...prev, i + 1]
                    )}
                  />
                ))}

                <button type="button" onClick={addExtraHook}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 w-full transition-colors hover:border-slate-500">
                  + Hook alternativo
                </button>

                {/* Body */}
                <Section
                  label="Body" value={form.body}
                  onChange={v => setForm(p => ({ ...p, body: v }))}
                  rows={8} placeholder="O desenvolvimento persuasivo..." alwaysEdit={isWriting}
                  formatValue={form.body_video_format}
                  onFormatChange={v => setForm(p => ({ ...p, body_video_format: v }))}
                  onMouseUp={handleMouseUp('body')}
                  annotations={annotations} annotationField="body"
                  selectable={!isCreate} isSelected={selBody} onSelect={() => setSelBody(s => !s)}
                />

                {/* CTA principal */}
                <Section
                  label="CTA" value={form.cta}
                  onChange={v => setForm(p => ({ ...p, cta: v }))}
                  rows={2} placeholder="A chamada para ação..." alwaysEdit={isWriting}
                  onMouseUp={handleMouseUp('cta')}
                  annotations={annotations} annotationField="cta"
                  selectable={!isCreate} isSelected={selCtaIdx === 0} onSelect={() => setSelCtaIdx(0)}
                />

                {/* CTAs alternativos */}
                {form.extra_ctas.map((c, i) => (
                  <Section key={i}
                    label={`CTA alternativo ${i + 1}`}
                    value={c} onChange={v => updateExtraCta(i, v)}
                    rows={2} placeholder={`CTA alternativo ${i + 1}...`}
                    alwaysEdit={isWriting} defaultEditing={!c}
                    onRemove={() => removeExtraCta(i)}
                    selectable={!isCreate} isSelected={selCtaIdx === i + 1} onSelect={() => setSelCtaIdx(i + 1)}
                  />
                ))}

                <button type="button" onClick={addExtraCta}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 w-full transition-colors hover:border-slate-500">
                  + CTA alternativo
                </button>

                <ActionBar />
              </div>
            )}

            {/* ── ABA INFO ── */}
            {leftTab === 'info' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className={labelCls}>Nome / Identificador</label>
                  <input value={form.name} onChange={set('name')} placeholder="Ex: TTS-01 · Dor nas costas · UGC" className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Produto</label>
                    <select value={form.product_id} onChange={set('product_id')} className={inputCls}>
                      <option value="">— Sem produto —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Modelo *</label>
                    <select value={form.business_model} onChange={e => { set('business_model')(e); if (e.target.value !== 'Non-shop') setForm(f => ({ ...f, nshop_line: '' })) }} className={inputCls}>
                      {BUSINESS_MODELS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  {form.business_model === 'Non-shop' && (
                    <div>
                      <label className={labelCls}>Sub-linha</label>
                      <div className="flex gap-2">
                        {(['GMV', 'Grow'] as const).map(line => (
                          <button type="button" key={line}
                            onClick={() => setForm(f => ({ ...f, nshop_line: f.nshop_line === line ? '' : line }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                              form.nshop_line === line
                                ? line === 'GMV' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-teal-500 border-teal-500 text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}>
                            {line}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Variação de</label>
                    <select value={form.source_copy_id} onChange={set('source_copy_id')} className={inputCls}>
                      <option value="">— Copy independente —</option>
                      {rootCopies.filter(c => c.id !== copy?.id).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name ?? c.hook?.slice(0, 50) ?? '(sem hook)'} [{c.business_model}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {COPY_TAGS.map(tag => {
                      const active = form.tags.includes(tag)
                      return (
                        <button key={tag} type="button" onClick={() => toggleTag(tag)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${active ? `${TAG_COLORS[tag]} border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {active ? '✓ ' : ''}{tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Ângulo</label>
                    <div className={`${inputCls} flex flex-wrap gap-1.5 min-h-[38px] cursor-text`}
                      onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                      {form.angles.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
                          {a}
                          <button type="button" onClick={() => setForm(p => ({ ...p, angles: p.angles.filter((_, j) => j !== i) }))}
                            className="text-slate-400 hover:text-red-500 leading-none">×</button>
                        </span>
                      ))}
                      <input
                        value={angleInput}
                        onChange={e => setAngleInput(e.target.value)}
                        onKeyDown={e => {
                          if ((e.key === 'Enter' || e.key === ',') && angleInput.trim()) {
                            e.preventDefault()
                            const v = angleInput.trim().replace(/,$/, '')
                            if (v && !form.angles.includes(v))
                              setForm(p => ({ ...p, angles: [...p.angles, v] }))
                            setAngleInput('')
                          } else if (e.key === 'Backspace' && !angleInput && form.angles.length) {
                            setForm(p => ({ ...p, angles: p.angles.slice(0, -1) }))
                          }
                        }}
                        onBlur={() => {
                          const v = angleInput.trim().replace(/,$/, '')
                          if (v && !form.angles.includes(v))
                            setForm(p => ({ ...p, angles: [...p.angles, v] }))
                          setAngleInput('')
                        }}
                        placeholder={form.angles.length ? '' : 'medo, curiosidade...'}
                        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tipo de hook</label>
                    <input value={form.hook_type} onChange={set('hook_type')} placeholder="pergunta, choque..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Estrutura</label>
                    <input value={form.structure} onChange={set('structure')} placeholder="PAS, AIDA..." className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Métrica</label>
                  <input value={form.metric} onChange={set('metric')} placeholder="ROAS 2.5, CTR 3%..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Notas</label>
                  <textarea value={form.notes} onChange={set('notes')} rows={3}
                    placeholder="Por que foi winner? Observações..." className={`${inputCls} resize-none`} />
                </div>
                <ActionBar />
              </div>
            )}

            {/* ── ABA HEADLINES ── */}
            {leftTab === 'headlines' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Headlines que aparecem junto ao hook no vídeo. Associe cada headline a uma instrução visual em Instruções Visuais.
                </p>

                {form.headlines.map((h, i) => (
                  <HeadlineBlock
                    key={i}
                    index={i}
                    value={h}
                    onChange={v => setForm(p => { const a = [...p.headlines]; a[i] = v; return { ...p, headlines: a } })}
                    onRemove={() => setForm(p => ({ ...p, headlines: p.headlines.filter((_, j) => j !== i) }))}
                    readOnly={false}
                  />
                ))}

                {form.headlines.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-600 italic py-4 text-center">Nenhuma headline ainda. Adicione abaixo.</p>
                )}

                <button type="button"
                  onClick={() => setForm(p => ({ ...p, headlines: [...p.headlines, ''] }))}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 w-full transition-colors hover:border-slate-500">
                  + Adicionar headline
                </button>

                <ActionBar />
              </div>
            )}
          </div>

          {/* ── PAINEL DIREITO ── */}
          {!isCreate && leftTab !== 'headlines' && (
            <div className="w-1/2 flex-shrink-0 border-l border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-800/30">
              <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                {(['preview', 'visual'] as const).map(tab => (
                  <button key={tab} onClick={() => setRightTab(tab)}
                    className={`flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${rightTab === tab ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    {tab === 'preview' ? '👁 Preview' : 'Instruções Visuais'}
                  </button>
                ))}
              </div>

              {/* ── PREVIEW ── */}
              {rightTab === 'preview' && (() => {
                const text = assembledCopy()
                return (
                  <div className="flex-1 overflow-y-auto flex flex-col">
                    <div className="flex-1 p-6">
                      {text
                        ? <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">{text}</p>
                        : <p className="text-xs text-slate-400 dark:text-slate-500 italic">Selecione os blocos na aba Copy usando os círculos</p>
                      }
                    </div>
                    {text && (
                      <div className="px-4 pb-4 flex-shrink-0">
                        <button type="button" onClick={handleCopy}
                          className={`w-full text-sm py-2.5 rounded-xl font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100'}`}>
                          {copied ? '✓ Copiado!' : 'Copiar copy completa'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── INSTRUÇÕES VISUAIS ── */}
              {rightTab === 'visual' && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {!pending && (
                    <p className="text-xs text-slate-400 dark:text-slate-400 px-4 py-3">
                      No modo leitura, selecione texto para anotar
                    </p>
                  )}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {pending && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-700/50 space-y-2.5">
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                          {fieldLabel(pending.field)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5">"{pending.selectedText}"</p>
                        <textarea value={annInstruction} onChange={e => setAnnInstruction(e.target.value)}
                          placeholder="Instrução para o editor de vídeo..." rows={4} autoFocus
                          className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none placeholder-slate-400 dark:placeholder-slate-500" />
                        {/* Headline selector — só aparece para campos hook e se houver headlines */}
                        {pending.field.startsWith('hook') && form.headlines.length > 0 && (
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
                              Headline que acompanha este hook
                            </label>
                            <select
                              value={pendingHeadline}
                              onChange={e => setPendingHeadline(e.target.value)}
                              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <option value="">— Nenhuma headline —</option>
                              {form.headlines.map((h, i) => (
                                <option key={i} value={h}>{h || `Headline ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={saveAnnotation} disabled={savingAnn || !annInstruction.trim()}
                            className="flex-1 text-xs py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium disabled:opacity-40 transition-colors">
                            {savingAnn ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => { setPending(null); setAnnInstruction(''); setPendingHeadline(''); window.getSelection()?.removeAllRanges() }}
                            className="text-xs py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">✕</button>
                        </div>
                      </div>
                    )}
                    {annotations.length > 0
                      ? annotations.map((ann, i) => (
                          <div key={ann.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 group space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-yellow-400 dark:bg-yellow-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{i + 1}</span>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                {fieldLabel(ann.field)}
                              </span>
                              <button onClick={() => deleteAnnotation(ann.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all">✕</button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">"{ann.selected_text}"</p>
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{ann.instruction}</p>
                            {/* Headline associada — só para hooks */}
                            {ann.field.startsWith('hook') && (
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 dark:text-slate-600 block mb-1">Headline</label>
                                {form.headlines.length > 0 ? (
                                  <select
                                    value={ann.headline ?? ''}
                                    onChange={async e => {
                                      const v = e.target.value
                                      await fetch(`/api/annotations/${ann.id}`, {
                                        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ headline: v || null }),
                                      })
                                      setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, headline: v || null } : a))
                                    }}
                                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none">
                                    <option value="">— Nenhuma —</option>
                                    {form.headlines.map((h, j) => (
                                      <option key={j} value={h}>{h || `Headline ${j + 1}`}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-xs text-slate-300 dark:text-slate-600 italic">
                                    {ann.headline ?? 'Sem headline — adicione na aba 🗞 Headlines'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      : !pending && (
                          <div className="text-center py-10">
                            <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">Selecione qualquer trecho no modo leitura e adicione instruções visuais</p>
                          </div>
                        )
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
