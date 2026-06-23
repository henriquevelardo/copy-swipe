'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy, Product, BusinessModel, COPY_TAGS, TAG_COLORS, BUSINESS_MODELS } from '@/lib/types'
import { FormatDropdown } from '@/components/FormatDropdown'

type BlockType = 'hook' | 'body' | 'cta'

const BLOCK_CONFIG: Record<BlockType, { label: string; emoji: string; hasFormat: boolean; placeholder: string; rows: number }> = {
  hook:   { label: 'Hook', emoji: '🎣', hasFormat: true,  placeholder: 'O gancho que para o scroll...',   rows: 5  },
  body:   { label: 'Body', emoji: '📝', hasFormat: true,  placeholder: 'O desenvolvimento persuasivo...', rows: 14 },
  cta:    { label: 'CTA',  emoji: '📣', hasFormat: false, placeholder: 'A chamada para ação...',          rows: 3  },
}

function getBlockText(copy: Copy, type: BlockType): string | null {
  if (type === 'hook') return copy.hook
  if (type === 'body') return copy.body
  if (type === 'cta')  return copy.cta
  return null
}

// ── Bloco individual ──────────────────────────────────────────────
function WorkflowBlock({
  type, value, onChange, formatValue, onFormatChange, copies,
}: {
  type: BlockType; value: string; onChange: (v: string) => void
  formatValue?: string; onFormatChange?: (v: string) => void
  copies: Copy[]
}) {
  const cfg = BLOCK_CONFIG[type]
  const [searching, setSearching] = useState(false)
  const [query, setQuery]         = useState('')

  const results = copies
    .map(c => ({ copy: c, text: getBlockText(c, type) }))
    .filter(({ text }) => !!text && (!query || text.toLowerCase().includes(query.toLowerCase())))
    .slice(0, 25)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <span className="text-lg">{cfg.emoji}</span>
        <span className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {cfg.label}
        </span>
        {cfg.hasFormat && onFormatChange && (
          <div className="ml-auto">
            <FormatDropdown value={formatValue ?? ''} onChange={onFormatChange} />
          </div>
        )}
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={cfg.placeholder}
        rows={cfg.rows}
        className="w-full px-5 py-4 text-base text-slate-800 dark:text-slate-200 bg-transparent resize-none focus:outline-none placeholder-slate-300 dark:placeholder-slate-600 leading-relaxed"
      />

      <div className="border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={() => setSearching(s => !s)}
          className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors px-5 py-3 w-full">
          <span>{searching ? '↑' : '🔍'}</span>
          <span>{searching ? 'Fechar busca' : 'Buscar no swipe'}</span>
          {!searching && results.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-300 dark:text-slate-600">
              {results.length} disponíveis
            </span>
          )}
        </button>

        {searching && (
          <div className="border-t border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="px-5 py-3">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Filtrar..." autoFocus
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600" />
            </div>
            <div className="max-h-64 overflow-y-auto px-5 pb-4 space-y-2">
              {results.length === 0
                ? <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">Nenhum resultado</p>
                : results.map(({ copy, text }) => (
                    <button key={copy.id} type="button"
                      onClick={() => { onChange(text!); setSearching(false); setQuery('') }}
                      className="w-full text-left text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl p-4 leading-relaxed transition-colors group">
                      {copy.name && (
                        <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                          {copy.name}
                        </span>
                      )}
                      <span className="line-clamp-3">{text}</span>
                      <span className="block mt-2 text-xs text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
                        Clique para usar →
                      </span>
                    </button>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────
export default function CriarPage() {
  const router = useRouter()

  const [tab, setTab] = useState<'nova' | 'rascunhos'>('nova')

  const [copies,   setCopies]   = useState<Copy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [drafts,   setDrafts]   = useState<Copy[]>([])
  const [saving,   setSaving]   = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)

  // Id do rascunho sendo editado (null = nova copy)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [hook,       setHook]       = useState('')
  const [hookFormat, setHookFormat] = useState('')
  const [body,       setBody]       = useState('')
  const [bodyFormat, setBodyFormat] = useState('')
  const [cta,        setCta]        = useState('')

  const [name,        setName]        = useState('')
  const [model,       setModel]       = useState<BusinessModel>('TikTok Shop')
  const [productId,   setProductId]   = useState('')
  const [angles,      setAngles]      = useState<string[]>([])
  const [angleInput,  setAngleInput]  = useState('')
  const [headlines,   setHeadlines]   = useState<string[]>([])
  const [tags,        setTags]        = useState<string[]>([])
  const [notes,       setNotes]       = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchDrafts = async () => {
    const res = await fetch('/api/copies?tag=Rascunho')
    setDrafts(await res.json())
  }

  useEffect(() => {
    fetch('/api/copies').then(r => r.json()).then(setCopies)
    fetch('/api/products').then(r => r.json()).then(setProducts)
    fetchDrafts()
  }, [])

  const assembled = [hook, body, cta].filter(Boolean).join('\n\n')

  const handleCopy = async () => {
    if (!assembled) return
    await navigator.clipboard.writeText(assembled)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const resetForm = () => {
    setEditingId(null)
    setHook(''); setHookFormat('')
    setBody(''); setBodyFormat(''); setCta('')
    setName(''); setModel('TikTok Shop'); setProductId('')
    setAngles([]); setAngleInput(''); setHeadlines([]); setTags([]); setNotes('')
  }

  const loadDraft = (draft: Copy) => {
    setEditingId(draft.id)
    setHook(draft.hook ?? '')
    setHookFormat(draft.hook_video_format ?? '')
    setBody(draft.body ?? '')
    setBodyFormat(draft.body_video_format ?? '')
    setCta(draft.cta ?? '')
    setName(draft.name ?? '')
    setModel(draft.business_model)
    setProductId(draft.product_id ?? '')
    setAngles(draft.angles?.length ? draft.angles : draft.angle ? [draft.angle] : [])
    setHeadlines(draft.headlines ?? [])
    setTags(draft.tags ?? [])
    setNotes(draft.notes ?? '')
    setTab('nova')
  }

  const save = async (draft: boolean) => {
    setSaving(true)
    const finalTags = draft
      ? [...new Set([...tags, 'Rascunho'])]
      : tags.filter(t => t !== 'Rascunho')

    const payload = {
      name: name || null, product_id: productId || null,
      business_model: model, angles: angles, angle: angles[0] || null,
      headlines: headlines,
      hook: hook || null, hook_video_format: hookFormat || null,
      body: body || null, body_video_format: bodyFormat || null,
      cta: cta || null, tags: finalTags, notes: notes || null,
      extra_hooks: [], extra_ctas: [],
    }

    if (editingId) {
      await fetch(`/api/copies/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/copies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    if (draft) {
      resetForm()
      fetchDrafts()
      setTab('rascunhos')
    } else {
      router.push('/')
    }
  }

  const publishDraft = async (draft: Copy) => {
    setPublishing(draft.id)
    const newTags = (draft.tags ?? []).filter(t => t !== 'Rascunho')
    await fetch(`/api/copies/${draft.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags }),
    })
    setPublishing(null)
    fetchDrafts()
  }

  const deleteDraft = async (id: string) => {
    if (!confirm('Excluir este rascunho?')) return
    await fetch(`/api/copies/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    fetchDrafts()
  }

  const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1'

  return (
    <div className="space-y-6">

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        <Link href="/"
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors pr-4 mr-2 border-r border-slate-200 dark:border-slate-700 py-2.5">
          ← Swipe
        </Link>
        {(['nova', 'rascunhos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t
                ? 'text-slate-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900 dark:after:bg-white'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t === 'nova' ? (editingId ? '✏️ Editando rascunho' : '✍️ Nova copy') : (
              <span className="flex items-center gap-2">
                Rascunhos
                {drafts.length > 0 && (
                  <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {drafts.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ABA: NOVA COPY / EDITANDO RASCUNHO ── */}
      {tab === 'nova' && (
        <div className="flex gap-6 items-start">

          {/* Editor */}
          <div className="flex-1 min-w-0 space-y-4">

            {editingId && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-2.5">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Editando rascunho{name ? `: ${name}` : ''}
                </span>
                <button onClick={resetForm}
                  className="ml-auto text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">
                  Descartar e criar nova →
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome da copy..."
                className="flex-1 text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
              />
              <select value={model} onChange={e => setModel(e.target.value as BusinessModel)}
                className="text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 flex-shrink-0">
                {BUSINESS_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <WorkflowBlock type="hook" value={hook} onChange={setHook} formatValue={hookFormat} onFormatChange={setHookFormat} copies={copies} />
            <WorkflowBlock type="body" value={body} onChange={setBody} formatValue={bodyFormat} onFormatChange={setBodyFormat} copies={copies} />
            <WorkflowBlock type="cta"    value={cta}    onChange={setCta}    copies={copies} />
          </div>

          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 sticky top-6 space-y-4">

            {/* Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">👁 Preview</span>
                {assembled && (
                  <button type="button" onClick={handleCopy}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {assembled
                  ? <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{assembled}</p>
                  : <p className="text-sm text-slate-300 dark:text-slate-600 italic">Escreva nos blocos ao lado...</p>
                }
              </div>
            </div>

            {/* Headlines */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">🗞 Headlines</span>
              </div>
              <div className="p-4 space-y-2">
                {headlines.map((h, i) => (
                  <div key={i} className="rounded-xl bg-slate-900 dark:bg-slate-950 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <button type="button" onClick={() => setHeadlines(p => p.filter((_, j) => j !== i))}
                        className="ml-auto text-slate-600 hover:text-red-400 text-sm transition-colors">×</button>
                    </div>
                    <textarea
                      value={h}
                      onChange={e => setHeadlines(p => { const a = [...p]; a[i] = e.target.value; return a })}
                      placeholder={`Headline ${i + 1}...`}
                      rows={2}
                      className="w-full bg-transparent text-white text-sm placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                ))}
                <button type="button"
                  onClick={() => setHeadlines(p => [...p, ''])}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 w-full transition-colors hover:border-slate-500">
                  + Adicionar headline
                </button>
              </div>
            </div>

            {/* Detalhes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button type="button" onClick={() => setDetailsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span>⚙️ Detalhes</span>
                <span className="text-slate-300 dark:text-slate-600 font-normal text-base leading-none">{detailsOpen ? '↑' : '↓'}</span>
              </button>

              {detailsOpen && (
                <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className={labelCls}>Produto</label>
                    <select value={productId} onChange={e => setProductId(e.target.value)} className={inputCls}>
                      <option value="">— Sem produto —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Ângulo</label>
                    <div className={`${inputCls} flex flex-wrap gap-1.5 min-h-[38px] cursor-text`}
                      onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                      {angles.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
                          {a}
                          <button type="button" onClick={() => setAngles(p => p.filter((_, j) => j !== i))}
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
                            if (v && !angles.includes(v)) setAngles(p => [...p, v])
                            setAngleInput('')
                          } else if (e.key === 'Backspace' && !angleInput && angles.length) {
                            setAngles(p => p.slice(0, -1))
                          }
                        }}
                        onBlur={() => {
                          const v = angleInput.trim().replace(/,$/, '')
                          if (v && !angles.includes(v)) setAngles(p => [...p, v])
                          setAngleInput('')
                        }}
                        placeholder={angles.length ? '' : 'medo, curiosidade...'}
                        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {COPY_TAGS.map(tag => {
                        const active = tags.includes(tag)
                        return (
                          <button key={tag} type="button" onClick={() => toggleTag(tag)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${active ? `${TAG_COLORS[tag]} border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            {active ? '✓ ' : ''}{tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Notas</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Observações..." rows={2} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => save(false)} disabled={saving || !assembled}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-40 transition-colors">
                {saving ? 'Salvando...' : '🚀 Publicar no Swipe'}
              </button>
              <button type="button" onClick={() => save(true)} disabled={saving}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                {editingId ? 'Atualizar rascunho' : 'Salvar rascunho'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── ABA: RASCUNHOS ── */}
      {tab === 'rascunhos' && (
        <div>
          {drafts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum rascunho salvo ainda.</p>
              <button onClick={() => setTab('nova')}
                className="mt-3 text-sm text-slate-500 dark:text-slate-400 underline hover:text-slate-800 dark:hover:text-white transition-colors">
                Criar uma nova copy →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div key={draft.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-700/40 p-4 flex gap-4 items-start hover:border-amber-300 dark:hover:border-amber-600/60 transition-colors">

                  {/* Badge rascunho */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      Rascunho
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {draft.name && (
                      <p className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                        {draft.name}
                      </p>
                    )}
                    {draft.hook && (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                        {draft.hook}
                      </p>
                    )}
                    {draft.body && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                        {draft.body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {draft.business_model}
                      </span>
                      {draft.product && (
                        <span className="text-xs text-slate-300 dark:text-slate-600">· {draft.product.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => publishDraft(draft)}
                      disabled={publishing === draft.id}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-40 transition-colors whitespace-nowrap">
                      {publishing === draft.id ? '...' : '🚀 Publicar'}
                    </button>
                    <button
                      onClick={() => loadDraft(draft)}
                      className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                      ✏️ Continuar
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="text-xs px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
