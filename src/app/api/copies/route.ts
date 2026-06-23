import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessModel = searchParams.get('business_model')
  const nshopLine     = searchParams.get('nshop_line')
  const tag           = searchParams.get('tag')
  const productId     = searchParams.get('product_id')
  const hookFormat    = searchParams.get('hook_format')
  const bodyFormat    = searchParams.get('body_format')
  const search        = searchParams.get('search')
  const dateFrom      = searchParams.get('date_from')
  const dateTo        = searchParams.get('date_to')

  let query = supabase
    .from('copies')
    .select('*, product:products(id, name)')
    .order('created_at', { ascending: false })

  if (businessModel) query = query.eq('business_model', businessModel)
  if (nshopLine)     query = query.eq('nshop_line', nshopLine)
  if (tag)           query = query.contains('tags', [tag])
  if (productId)     query = query.eq('product_id', productId)
  if (hookFormat)    query = query.eq('hook_video_format', hookFormat)
  if (bodyFormat)    query = query.eq('body_video_format', bodyFormat)
  if (dateFrom)      query = query.gte('published_at', dateFrom)
  if (dateTo)        query = query.lte('published_at', dateTo + 'T23:59:59.999Z')
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,hook.ilike.%${search}%,body.ilike.%${search}%,angle.ilike.%${search}%,cta.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const isDraft = (body.tags ?? []).includes('Rascunho')
  const payload = isDraft
    ? body
    : { ...body, published_at: body.published_at ?? new Date().toISOString() }

  const { data, error } = await supabase
    .from('copies')
    .insert(payload)
    .select('*, product:products(id, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
