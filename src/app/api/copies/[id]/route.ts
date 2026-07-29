import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('copies')
    .select('*, product:products(id, name)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Auto-set published_at when a copy leaves draft state for the first time
  let payload = body
  if (body.tags !== undefined && !(body.tags as string[]).includes('Rascunho')) {
    const { data: current } = await supabase
      .from('copies').select('published_at').eq('id', id).single()
    if (current && !current.published_at) {
      payload = { ...body, published_at: new Date().toISOString() }
    }
  }

  const { data, error } = await supabase
    .from('copies')
    .update(payload)
    .eq('id', id)
    .select('*, product:products(id, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('copies').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
