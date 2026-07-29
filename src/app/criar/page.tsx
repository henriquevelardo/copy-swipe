'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy } from '@/lib/types'

export default function CriarPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Copy[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)

  const fetchDrafts = async () => {
    setLoading(true)
    const res = await fetch('/api/copies?tag=Rascunho')
    setDrafts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchDrafts() }, [])

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
    fetchDrafts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-ink dark:text-ink-dark">Criar</h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-0.5">
            Comece uma copy nova ou continue um rascunho salvo.
          </p>
        </div>
        <button onClick={() => router.push('/copy/new')}
          className="px-4 py-2 bg-accent dark:bg-accent-dark text-card text-sm font-medium rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">
          + Nova copy
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="tab-label text-ink-soft dark:text-ink-soft-dark">Rascunhos</h2>
          {drafts.length > 0 && (
            <span className="bg-amber/15 dark:bg-amber-dark/20 text-amber dark:text-amber-dark text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {drafts.length}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Carregando...</p>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-soft dark:text-ink-soft-dark text-sm">Nenhum rascunho salvo ainda.</p>
            <Link href="/copy/new" className="mt-3 inline-block text-sm text-ink-soft dark:text-ink-soft-dark underline hover:text-ink dark:hover:text-ink-dark transition-colors">
              Criar uma nova copy →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map(draft => (
              <div key={draft.id}
                className="bg-card dark:bg-card-dark rounded-md border border-amber/30 dark:border-amber-dark/30 p-4 flex gap-4 items-start hover:border-amber dark:hover:border-amber-dark transition-colors">

                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber/15 dark:bg-amber-dark/20 text-amber dark:text-amber-dark">
                    Rascunho
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {draft.name && (
                    <p className="text-xs font-mono font-semibold text-ink-soft dark:text-ink-soft-dark tracking-wide">
                      {draft.name}
                    </p>
                  )}
                  {draft.hook && (
                    <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-2 leading-snug">
                      {draft.hook}
                    </p>
                  )}
                  {draft.body && (
                    <p className="text-xs text-ink-soft dark:text-ink-soft-dark line-clamp-1 leading-relaxed">
                      {draft.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-ink-soft dark:text-ink-soft-dark">{draft.business_model}</span>
                    {draft.product && (
                      <span className="text-xs text-ink-soft/50 dark:text-ink-soft-dark/50">· {draft.product.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => publishDraft(draft)}
                    disabled={publishing === draft.id}
                    className="text-xs font-semibold px-3 py-1.5 bg-ink dark:bg-ink-dark text-card dark:text-paper-dark rounded-lg hover:opacity-90 disabled:opacity-40 transition-colors whitespace-nowrap">
                    {publishing === draft.id ? '...' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => router.push(`/copy/${draft.id}`)}
                    className="text-xs px-3 py-1.5 border border-line dark:border-line-dark text-ink-soft dark:text-ink-soft-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors whitespace-nowrap">
                    Continuar
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="text-xs px-3 py-1.5 text-accent dark:text-accent-dark hover:opacity-70 rounded-lg transition-colors whitespace-nowrap">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
