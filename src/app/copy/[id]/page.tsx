'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Copy, Product, BusinessModel, NshopLine, Annotation,
  COPY_TAGS, TAG_COLORS, BUSINESS_MODELS, MODEL_COLORS,
} from '@/lib/types'
import { FormatDropdown } from '@/components/FormatDropdown'

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

const inputCls = 'w-full text-sm border border-line dark:border-line-dark rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40 bg-card dark:bg-card-dark text-ink dark:text-ink-dark placeholder-ink-soft/60 dark:placeholder-ink-soft-dark/60'
const labelCls = 'block tab-label text-ink-soft dark:text-ink-soft-dark mb-1'

function fieldLabel(field: string) {
  if (field === 'hook') return 'Hook'
  if (field === 'body') return 'Body'
  if (field === 'cta')  return 'CTA'
  const hm = field.match(/^hook_(\d+)$/); if (hm) return `Hook alt ${hm[1]}`
  const cm = field.match(/^cta_(\d+)$/);  if (cm) return `CTA alt ${cm[1]}`
  return field
}

/* ── Texto com destaques clicáveis (estilo Google Docs) ─────────── */
function AnnotatedText({ text, annotations, field, onMarkClick }: {
  text: string; annotations: Annotation[]; field: string; onMarkClick: (ann: Annotation) => void
}) {
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
          ? <mark key={i} onClick={e => { e.stopPropagation(); onMarkClick(fieldAnns[seg.idx!]) }}
              className="bg-amber/30 dark:bg-amber-dark/30 hover:bg-amber/50 dark:hover:bg-amber-dark/50 rounded-sm cursor-pointer transition-colors">
              {seg.text}<sup className="text-amber dark:text-amber-dark text-[10px] font-bold ml-0.5 select-none">{seg.idx + 1}</sup>
            </mark>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  )
}

/* ── Bloco de headline ─────────────────────────────────────────── */
function HeadlineBlock({ index, value, onChange, onRemove }: {
  index: number; value: string; onChange: (v: string) => void; onRemove: () => void
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <div className="rounded-md bg-ink dark:bg-ink-dark p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-card/10 dark:bg-paper-dark/10 text-card dark:text-paper-dark text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
        <span className="tab-label text-card/50 dark:text-paper-dark/50">Headline</span>
        <button type="button" onClick={onRemove}
          className="ml-auto text-card/40 dark:text-paper-dark/40 hover:text-accent-dark text-sm leading-none transition-colors">×</button>
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Escreva a headline ${index + 1}...`}
        rows={2}
        className="w-full bg-transparent text-card dark:text-paper-dark text-sm placeholder-card/40 dark:placeholder-paper-dark/40 focus:outline-none resize-none leading-relaxed"
      />
    </div>
  )
}

/* ── Bloco editável (Hook/Body/CTA) — sempre em modo escrita ─────── */
function EditableBlock({
  label, value, onChange, rows = 4, placeholder,
  formatValue, onFormatChange, onRemove,
  selectable, isSelected, onSelect, selectionOrder,
}: {
  label: string; value: string; onChange: (v: string) => void
  rows?: number; placeholder?: string
  formatValue?: string; onFormatChange?: (v: string) => void
  onRemove?: () => void
  selectable?: boolean; isSelected?: boolean; onSelect?: () => void; selectionOrder?: number
}) {
  const sel = selectable && isSelected
  const taRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return (
    <div className={`transition-all rounded-md ${sel ? 'bg-ink dark:bg-ink-dark p-2.5 shadow-lg' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {selectable && (
          <button type="button" onClick={onSelect}
            title={sel ? (selectionOrder != null ? `Posição ${selectionOrder} — clique para remover` : 'Selecionado') : 'Adicionar ao preview'}
            className={`flex-shrink-0 relative w-4 h-4 rounded-full border-2 transition-all ${
              sel ? 'border-card dark:border-card-dark bg-card dark:bg-card-dark' : 'border-line dark:border-line-dark hover:border-ink-soft dark:hover:border-ink-soft-dark'
            }`}>
            {sel && selectionOrder != null
              ? <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-ink dark:text-ink-dark leading-none">{selectionOrder}</span>
              : sel ? <span className="block w-1 h-1 bg-ink dark:bg-ink-dark rounded-full m-auto" /> : null}
          </button>
        )}
        <span className={`text-[10px] font-bold uppercase tracking-widest ${sel ? 'text-card/60 dark:text-paper-dark/60' : 'text-ink-soft/50 dark:text-ink-soft-dark/50'}`}>{label}</span>
        {formatValue !== undefined && onFormatChange && (
          <FormatDropdown value={formatValue} onChange={onFormatChange} invertedStyle={sel} />
        )}
        {onRemove && (
          <button type="button" onClick={onRemove}
            className={`ml-auto text-sm leading-none transition-colors ${sel ? 'text-card/40 hover:text-accent-dark' : 'text-ink-soft/50 dark:text-ink-soft-dark/50 hover:text-accent dark:hover:text-accent-dark'}`}>×</button>
        )}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full text-base border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 resize-none overflow-hidden leading-relaxed ${
          sel
            ? 'bg-ink/90 dark:bg-ink-dark/90 text-card dark:text-paper-dark border-ink dark:border-ink-dark placeholder-card/40 dark:placeholder-paper-dark/40 focus:ring-accent/50 dark:focus:ring-accent-dark/50'
            : 'bg-card dark:bg-card-dark text-ink dark:text-ink-dark border-line dark:border-line-dark placeholder-ink-soft/60 dark:placeholder-ink-soft-dark/60 focus:ring-accent/40 dark:focus:ring-accent-dark/40'
        }`}
      />
    </div>
  )
}

type AnnModal = { mode: 'create' | 'edit'; field: string; selectedText: string; instruction: string; headline: string; annId?: string }

export default function CopyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentId = searchParams.get('parent') ?? ''
  const isCreate = id === 'new'

  const [copy, setCopy]         = useState<Copy | null>(null)
  const [form, setForm]         = useState<FormData>(EMPTY)
  const [products, setProducts] = useState<Product[]>([])
  const [rootCopies, setRootCopies] = useState<Copy[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading]   = useState(!isCreate)
  const [saving, setSaving]     = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [tab, setTab]           = useState<'copy' | 'info' | 'headlines'>('copy')

  const [selHookIdxs, setSelHookIdxs] = useState<number[]>([0])
  const [selCtaIdx, setSelCtaIdx]     = useState(0)
  const [selBody, setSelBody]         = useState(true)
  const [copied, setCopied]           = useState(false)
  const [angleInput, setAngleInput]   = useState('')

  const [annModal, setAnnModal] = useState<AnnModal | null>(null)
  const [savingAnn, setSavingAnn] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
    fetch('/api/copies').then(r => r.json()).then(d => setRootCopies(Array.isArray(d) ? d.filter((c: Copy) => !c.source_copy_id) : []))
  }, [])

  useEffect(() => {
    if (isCreate) {
      setForm({ ...EMPTY, source_copy_id: parentId })
      setCopy(null)
      setAnnotations([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/copies/${id}`).then(r => r.json()).then(data => {
      setCopy(data)
      setForm({
        name: data.name ?? '', product_id: data.product_id ?? '',
        business_model: data.business_model, nshop_line: data.nshop_line ?? '',
        angles: data.angles?.length ? data.angles : (data.angle ? [data.angle] : []),
        headlines: data.headlines ?? [],
        hook_type: data.hook_type ?? '', structure: data.structure ?? '',
        hook: data.hook ?? '', hook_video_format: data.hook_video_format ?? '',
        extra_hooks: data.extra_hooks ?? [],
        body: data.body ?? '', body_video_format: data.body_video_format ?? '',
        cta: data.cta ?? '', extra_ctas: data.extra_ctas ?? [],
        tags: data.tags ?? [], metric: data.metric ?? '', notes: data.notes ?? '',
        source_copy_id: data.source_copy_id ?? '',
      })
      setSelHookIdxs([0]); setSelCtaIdx(0); setSelBody(true)
      setLoading(false)
    })
    fetch(`/api/copies/${id}/annotations`).then(r => r.json()).then(d => setAnnotations(Array.isArray(d) ? d : []))
  }, [id, isCreate, parentId])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleTag = (tag: string) =>
    setForm(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }))

  const addExtraHook    = () => setForm(p => ({ ...p, extra_hooks: [...p.extra_hooks, ''] }))
  const updateExtraHook = (i: number, v: string) => setForm(p => { const a = [...p.extra_hooks]; a[i] = v; return { ...p, extra_hooks: a } })
  const removeExtraHook = (i: number) => {
    setForm(p => ({ ...p, extra_hooks: p.extra_hooks.filter((_, j) => j !== i) }))
    setSelHookIdxs(prev => prev.filter(idx => idx !== i + 1).map(idx => idx > i + 1 ? idx - 1 : idx))
  }

  const addExtraCta    = () => setForm(p => ({ ...p, extra_ctas: [...p.extra_ctas, ''] }))
  const updateExtraCta = (i: number, v: string) => setForm(p => { const a = [...p.extra_ctas]; a[i] = v; return { ...p, extra_ctas: a } })
  const removeExtraCta = (i: number) => {
    setForm(p => ({ ...p, extra_ctas: p.extra_ctas.filter((_, j) => j !== i) }))
    if (selCtaIdx === i + 1) setSelCtaIdx(0)
    else if (selCtaIdx > i + 1) setSelCtaIdx(s => s - 1)
  }

  const handleSave = async () => {
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
    if (isCreate) {
      const res = await fetch('/api/copies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setSaving(false)
      router.push(`/copy/${data.id}`)
      return
    }
    const res = await fetch(`/api/copies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setCopy(data)
    setSaving(false)
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800)
  }

  const handleDelete = async () => {
    if (!copy || !confirm('Excluir esta copy? Não tem como desfazer.')) return
    await fetch(`/api/copies/${copy.id}`, { method: 'DELETE' })
    router.push('/')
  }

  const allHooks = [form.hook, ...form.extra_hooks].filter(Boolean) as string[]
  const allCtas  = [form.cta, ...form.extra_ctas].filter(Boolean) as string[]

  const previewSegments = useMemo(() => {
    const segs: { field: string; text: string }[] = []
    selHookIdxs.forEach(i => {
      const t = allHooks[i]
      if (t) segs.push({ field: i === 0 ? 'hook' : `hook_${i}`, text: t })
    })
    if (selBody && form.body) segs.push({ field: 'body', text: form.body })
    const ctaText = allCtas[selCtaIdx]
    if (ctaText) segs.push({ field: selCtaIdx === 0 ? 'cta' : `cta_${selCtaIdx}`, text: ctaText })
    return segs
  }, [selHookIdxs, allHooks, selBody, form.body, selCtaIdx, allCtas])

  const assembledText = previewSegments.map(s => s.text).join('\n\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(assembledText)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handlePreviewMouseUp = useCallback(() => {
    if (isCreate) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (text.length < 2) return
    let node: Node | null = sel.anchorNode
    let field: string | null = null
    while (node) {
      if (node instanceof HTMLElement && node.dataset.field) { field = node.dataset.field; break }
      node = node.parentNode
    }
    if (!field) return
    setAnnModal({ mode: 'create', field, selectedText: text, instruction: '', headline: '' })
  }, [isCreate])

  const openEditAnnotation = (ann: Annotation) => {
    setAnnModal({ mode: 'edit', field: ann.field, selectedText: ann.selected_text, instruction: ann.instruction, headline: ann.headline ?? '', annId: ann.id })
  }

  const saveAnnotation = async () => {
    if (!annModal || !annModal.instruction.trim() || !copy) return
    setSavingAnn(true)
    const isHookField = annModal.field.startsWith('hook')
    if (annModal.mode === 'create') {
      const res = await fetch(`/api/copies/${copy.id}/annotations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: annModal.field, selected_text: annModal.selectedText,
          instruction: annModal.instruction.trim(),
          headline: (isHookField && annModal.headline) ? annModal.headline : null,
        }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(`Erro: ${err.error ?? res.status}`); setSavingAnn(false); return }
    } else if (annModal.annId) {
      await fetch(`/api/annotations/${annModal.annId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: annModal.instruction.trim(), headline: (isHookField && annModal.headline) ? annModal.headline : null }),
      })
    }
    setSavingAnn(false)
    setAnnModal(null)
    window.getSelection()?.removeAllRanges()
    const list = await fetch(`/api/copies/${copy.id}/annotations`)
    setAnnotations(await list.json())
  }

  const deleteAnnotation = async () => {
    if (!annModal?.annId) return
    await fetch(`/api/annotations/${annModal.annId}`, { method: 'DELETE' })
    setAnnotations(prev => prev.filter(a => a.id !== annModal.annId))
    setAnnModal(null)
  }

  if (loading) return <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Carregando...</p>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-line dark:border-line-dark flex-shrink-0">
        <Link href="/" className="text-sm text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark transition-colors flex-shrink-0">← Swipe</Link>
        <span className={`tab-label px-2 py-0.5 rounded flex-shrink-0 ${MODEL_COLORS[form.business_model]}`}>{form.business_model}</span>
        <input value={form.name} onChange={set('name')} placeholder={isCreate ? 'Nova copy...' : 'Nome / identificador...'}
          className="flex-1 min-w-0 text-sm font-semibold text-ink dark:text-ink-dark bg-transparent focus:outline-none placeholder-ink-soft/50 dark:placeholder-ink-soft-dark/50" />
        {form.source_copy_id && <span className="tab-label px-2 py-0.5 bg-teal/10 dark:bg-teal-dark/15 text-teal dark:text-teal-dark rounded flex-shrink-0">→ Variação</span>}
        {savedFlash && <span className="text-xs text-moss dark:text-moss-dark flex-shrink-0">✓ Salvo</span>}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isCreate && (
            <button onClick={handleDelete} className="text-xs text-accent dark:text-accent-dark hover:opacity-70 px-2 py-1.5 rounded transition-colors">Excluir</button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="text-sm px-4 py-1.5 bg-ink dark:bg-ink-dark text-card dark:text-paper-dark font-medium rounded hover:opacity-90 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : isCreate ? 'Criar copy' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line dark:border-line-dark flex-shrink-0 px-2">
        {(['copy', 'info', 'headlines'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${tab === t ? 'text-ink dark:text-ink-dark border-b-2 border-ink dark:border-ink-dark' : 'text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark'}`}>
            {t === 'copy' ? 'Copy' : t === 'info' ? 'Info' : 'Headlines'}
          </button>
        ))}
      </div>

      {/* ── ABA COPY: split view ── */}
      {tab === 'copy' && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-w-0">
            {!isCreate && (allHooks.length > 1 || allCtas.length > 1) && (
              <p className="text-xs text-ink-soft dark:text-ink-soft-dark flex items-center gap-1.5">
                <span className="flex-shrink-0 inline-block w-3 h-3 rounded-full bg-ink dark:bg-ink-dark" />
                Clique no círculo para selecionar/empilhar blocos no preview
              </p>
            )}
            <EditableBlock
              label="Hook" value={form.hook} onChange={v => setForm(p => ({ ...p, hook: v }))}
              rows={4} placeholder="O gancho principal..."
              formatValue={form.hook_video_format} onFormatChange={v => setForm(p => ({ ...p, hook_video_format: v }))}
              selectable={!isCreate} isSelected={selHookIdxs.includes(0)}
              selectionOrder={selHookIdxs.includes(0) ? selHookIdxs.indexOf(0) + 1 : undefined}
              onSelect={() => setSelHookIdxs(prev => prev.includes(0) ? prev.filter(i => i !== 0) : [...prev, 0])}
            />
            {form.extra_hooks.map((h, i) => (
              <EditableBlock key={i} label={`Hook alternativo ${i + 1}`} value={h} onChange={v => updateExtraHook(i, v)}
                rows={3} placeholder={`Hook alternativo ${i + 1}...`} onRemove={() => removeExtraHook(i)}
                selectable={!isCreate} isSelected={selHookIdxs.includes(i + 1)}
                selectionOrder={selHookIdxs.includes(i + 1) ? selHookIdxs.indexOf(i + 1) + 1 : undefined}
                onSelect={() => setSelHookIdxs(prev => prev.includes(i + 1) ? prev.filter(j => j !== i + 1) : [...prev, i + 1])}
              />
            ))}
            <button type="button" onClick={addExtraHook}
              className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark border border-dashed border-line dark:border-line-dark rounded px-3 py-2 w-full transition-colors hover:border-accent dark:hover:border-accent-dark">
              + Hook alternativo
            </button>

            <EditableBlock
              label="Body" value={form.body} onChange={v => setForm(p => ({ ...p, body: v }))}
              rows={10} placeholder="O desenvolvimento persuasivo..."
              formatValue={form.body_video_format} onFormatChange={v => setForm(p => ({ ...p, body_video_format: v }))}
              selectable={!isCreate} isSelected={selBody} onSelect={() => setSelBody(s => !s)}
            />

            <EditableBlock
              label="CTA" value={form.cta} onChange={v => setForm(p => ({ ...p, cta: v }))}
              rows={2} placeholder="A chamada para ação..."
              selectable={!isCreate} isSelected={selCtaIdx === 0} onSelect={() => setSelCtaIdx(0)}
            />
            {form.extra_ctas.map((c, i) => (
              <EditableBlock key={i} label={`CTA alternativo ${i + 1}`} value={c} onChange={v => updateExtraCta(i, v)}
                rows={2} placeholder={`CTA alternativo ${i + 1}...`} onRemove={() => removeExtraCta(i)}
                selectable={!isCreate} isSelected={selCtaIdx === i + 1} onSelect={() => setSelCtaIdx(i + 1)}
              />
            ))}
            <button type="button" onClick={addExtraCta}
              className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark border border-dashed border-line dark:border-line-dark rounded px-3 py-2 w-full transition-colors hover:border-accent dark:hover:border-accent-dark">
              + CTA alternativo
            </button>
          </div>

          {/* ── PREVIEW ── */}
          <div className="w-[45%] flex-shrink-0 border-l border-line dark:border-line-dark flex flex-col bg-paper dark:bg-paper-dark">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-soft dark:text-ink-soft-dark">Preview</span>
              {!isCreate && <span className="text-[10px] text-ink-soft/50 dark:text-ink-soft-dark/50">selecione um trecho para anotar</span>}
            </div>
            <div ref={previewRef} onMouseUp={handlePreviewMouseUp} className="flex-1 overflow-y-auto p-6">
              {previewSegments.length ? (
                <div className="text-sm text-ink dark:text-ink-dark leading-relaxed whitespace-pre-wrap select-text">
                  {previewSegments.map((seg, i) => (
                    <span key={i} data-field={seg.field}>
                      <AnnotatedText text={seg.text} annotations={annotations} field={seg.field} onMarkClick={openEditAnnotation} />
                      {i < previewSegments.length - 1 && '\n\n'}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft dark:text-ink-soft-dark italic">Selecione os blocos ao lado usando os círculos</p>
              )}
            </div>
            {previewSegments.length > 0 && (
              <div className="px-4 pb-4 flex-shrink-0">
                <button type="button" onClick={handleCopy}
                  className={`w-full text-sm py-2.5 rounded-md font-medium transition-colors ${copied ? 'bg-moss text-card' : 'bg-ink dark:bg-ink-dark text-card dark:text-paper-dark hover:opacity-90'}`}>
                  {copied ? '✓ Copiado!' : 'Copiar copy completa'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA INFO ── */}
      {tab === 'info' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          ? line === 'GMV' ? 'bg-teal border-teal text-card' : 'bg-moss border-moss text-card'
                          : 'bg-card dark:bg-card-dark border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'
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
                  <option key={c.id} value={c.id}>{c.name ?? c.hook?.slice(0, 50) ?? '(sem hook)'} [{c.business_model}]</option>
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
                    className={`tab-label px-3 py-1.5 rounded border transition-colors ${active ? `${TAG_COLORS[tag]} border-transparent` : 'border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark'}`}>
                    {active ? '✓ ' : ''}{tag}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Ângulo</label>
              <div className={`${inputCls} flex flex-wrap gap-1.5 min-h-[38px] cursor-text`}
                onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                {form.angles.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark text-xs font-medium px-2 py-0.5 rounded">
                    {a}
                    <button type="button" onClick={() => setForm(p => ({ ...p, angles: p.angles.filter((_, j) => j !== i) }))}
                      className="text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark leading-none">×</button>
                  </span>
                ))}
                <input
                  value={angleInput}
                  onChange={e => setAngleInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && angleInput.trim()) {
                      e.preventDefault()
                      const v = angleInput.trim().replace(/,$/, '')
                      if (v && !form.angles.includes(v)) setForm(p => ({ ...p, angles: [...p.angles, v] }))
                      setAngleInput('')
                    } else if (e.key === 'Backspace' && !angleInput && form.angles.length) {
                      setForm(p => ({ ...p, angles: p.angles.slice(0, -1) }))
                    }
                  }}
                  onBlur={() => {
                    const v = angleInput.trim().replace(/,$/, '')
                    if (v && !form.angles.includes(v)) setForm(p => ({ ...p, angles: [...p.angles, v] }))
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
        </div>
      )}

      {/* ── ABA HEADLINES ── */}
      {tab === 'headlines' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
            Headlines que aparecem junto ao hook no vídeo. Associe cada headline a uma instrução visual selecionando o hook no preview.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {form.headlines.map((h, i) => (
              <HeadlineBlock key={i} index={i} value={h}
                onChange={v => setForm(p => { const a = [...p.headlines]; a[i] = v; return { ...p, headlines: a } })}
                onRemove={() => setForm(p => ({ ...p, headlines: p.headlines.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>
          {form.headlines.length === 0 && (
            <p className="text-xs text-ink-soft/60 dark:text-ink-soft-dark/60 italic py-4 text-center">Nenhuma headline ainda. Adicione abaixo.</p>
          )}
          <button type="button" onClick={() => setForm(p => ({ ...p, headlines: [...p.headlines, ''] }))}
            className="text-xs text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark border border-dashed border-line dark:border-line-dark rounded px-3 py-2.5 w-full transition-colors hover:border-accent dark:hover:border-accent-dark">
            + Adicionar headline
          </button>
        </div>
      )}

      {/* ── MODAL de instrução visual (criar/editar anotação) ── */}
      {annModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAnnModal(null)} />
          <div className="relative bg-card dark:bg-card-dark rounded-md shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="tab-label text-amber dark:text-amber-dark">{fieldLabel(annModal.field)}</span>
              <button onClick={() => setAnnModal(null)} className="text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-ink-soft dark:text-ink-soft-dark italic line-clamp-3 bg-paper dark:bg-paper-dark rounded px-2 py-1.5">"{annModal.selectedText}"</p>
            <textarea
              value={annModal.instruction}
              onChange={e => setAnnModal(m => m && { ...m, instruction: e.target.value })}
              placeholder="Instrução para o editor de vídeo..." rows={4} autoFocus
              className="w-full text-sm border border-line dark:border-line-dark rounded px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber/40 bg-card dark:bg-card-dark text-ink dark:text-ink-dark resize-none placeholder-ink-soft/60 dark:placeholder-ink-soft-dark/60" />
            {annModal.field.startsWith('hook') && form.headlines.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-soft dark:text-ink-soft-dark block mb-1">Headline que acompanha este hook</label>
                <select value={annModal.headline} onChange={e => setAnnModal(m => m && { ...m, headline: e.target.value })}
                  className="w-full text-sm border border-line dark:border-line-dark rounded px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber/40 bg-card dark:bg-card-dark text-ink-soft dark:text-ink-soft-dark">
                  <option value="">— Nenhuma headline —</option>
                  {form.headlines.map((h, i) => <option key={i} value={h}>{h || `Headline ${i + 1}`}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={saveAnnotation} disabled={savingAnn || !annModal.instruction.trim()}
                className="flex-1 text-sm py-2 bg-amber dark:bg-amber-dark text-card rounded font-medium disabled:opacity-40 hover:opacity-90 transition-colors">
                {savingAnn ? 'Salvando...' : 'Salvar'}
              </button>
              {annModal.mode === 'edit' && (
                <button onClick={deleteAnnotation} className="text-sm py-2 px-3 text-accent dark:text-accent-dark hover:bg-accent/10 dark:hover:bg-accent-dark/10 rounded transition-colors">
                  Excluir
                </button>
              )}
              <button onClick={() => setAnnModal(null)} className="text-sm py-2 px-3 text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark rounded transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
