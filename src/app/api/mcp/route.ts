import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { BUSINESS_MODELS } from '@/lib/types'

// ── Autenticação (bearer token compartilhado) ───────────────────────
//
// Endpoint público na internet, então protegido por um token fixo.
// Configure MCP_AUTH_TOKEN nas env vars da Vercel e distribua o mesmo
// valor para cada cliente MCP que precisar se conectar (Claude, HERMES...).
function checkAuth(req: NextRequest): boolean {
  const expected = process.env.MCP_AUTH_TOKEN
  if (!expected) return false // nunca abrir sem token configurado
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  return token === expected
}

// ── Handler MCP ───────────────────────────────────────────────────────
const mcpHandler = createMcpHandler((server) => {

  server.registerTool(
    'resumo_swipe',
    {
      title: 'Resumo do swipe file',
      description:
        'Visão geral do swipe file: total de copies, distribuição por modelo, tags ativas, ângulos mais usados. Use SEMPRE no início de uma sessão de criação para entender o contexto.',
      inputSchema: z.object({}),
    },
    async () => {
      const { data, error } = await supabase
        .from('copies')
        .select('business_model, tags, angle, hook_video_format, source_copy_id')
      if (error) throw new Error(error.message)

      const byModel: Record<string, number> = {}
      const tagCount: Record<string, number> = {}
      const angleCount: Record<string, number> = {}
      const hookFormatCount: Record<string, number> = {}
      let variacoes = 0

      for (const c of data) {
        byModel[c.business_model] = (byModel[c.business_model] ?? 0) + 1
        if (c.source_copy_id) variacoes++
        for (const tag of c.tags ?? []) tagCount[tag] = (tagCount[tag] ?? 0) + 1
        if (c.angle) angleCount[c.angle] = (angleCount[c.angle] ?? 0) + 1
        if (c.hook_video_format)
          hookFormatCount[c.hook_video_format] = (hookFormatCount[c.hook_video_format] ?? 0) + 1
      }

      const resumo = {
        total_copies: data.length,
        variacoes,
        copies_independentes: data.length - variacoes,
        por_modelo: byModel,
        status_tags: tagCount,
        angulos_mais_usados: Object.entries(angleCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([angulo, qtd]) => ({ angulo, qtd })),
        formatos_hook: hookFormatCount,
      }

      return { content: [{ type: 'text', text: JSON.stringify(resumo, null, 2) }] }
    },
  )

  server.registerTool(
    'listar_copies',
    {
      title: 'Listar copies',
      description:
        'Lista copies do swipe file com filtros opcionais. Retorna hook, body, CTA e metadados. Use para pesquisar referências antes de criar algo novo.',
      inputSchema: z.object({
        modelo: z.enum(BUSINESS_MODELS).optional().describe('Filtrar por modelo de negócio'),
        tag: z.string().optional().describe('Filtrar por tag: Rodando, Validada, Teste, Pendente, Rascunho'),
        busca: z.string().optional().describe('Buscar texto no hook, body, CTA ou nome'),
        limite: z.number().optional().describe('Máximo de resultados (padrão 20)'),
      }),
    },
    async ({ modelo, tag, busca, limite }) => {
      let query = supabase
        .from('copies')
        .select('id, name, business_model, angle, hook_type, hook, body, cta, tags, hook_video_format, source_copy_id, metric, created_at')
        .order('created_at', { ascending: false })
        .limit(limite ?? 20)

      if (modelo) query = query.eq('business_model', modelo)
      if (tag) query = query.contains('tags', [tag])
      if (busca) query = query.or(`hook.ilike.%${busca}%,body.ilike.%${busca}%,name.ilike.%${busca}%,cta.ilike.%${busca}%`)

      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.registerTool(
    'ver_copy',
    {
      title: 'Ver copy',
      description:
        'Retorna todos os campos de uma copy específica: hooks alternativos, CTAs alternativos, frases de ligação, anotações visuais, métricas e notas.',
      inputSchema: z.object({ id: z.string().describe('UUID da copy') }),
    },
    async ({ id }) => {
      const { data: copy, error } = await supabase
        .from('copies')
        .select('*, product:products(name, niche, offer, avatar)')
        .eq('id', id)
        .single()
      if (error) throw new Error(error.message)

      const { data: annotations } = await supabase
        .from('copy_annotations')
        .select('field, selected_text, instruction')
        .eq('copy_id', id)
        .order('created_at')

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ...copy, instrucoes_visuais: annotations ?? [] }, null, 2),
        }],
      }
    },
  )

  server.registerTool(
    'criar_copy',
    {
      title: 'Criar copy',
      description:
        'Salva uma nova copy no swipe file. Use após gerar uma copy para registrá-la. Pode criar como variação de outra passando source_copy_id.',
      inputSchema: z.object({
        nome: z.string().optional().describe('Identificador curto (ex: TTS-03 · Curiosidade · Breaking news)'),
        modelo: z.enum(BUSINESS_MODELS),
        hook: z.string().optional(),
        bridge_sentence: z.string().optional().describe('Frase de ligação entre hook e body'),
        body: z.string().optional(),
        cta: z.string().optional(),
        angulo: z.string().optional().describe('Ex: medo, curiosidade, inveja social, prova social'),
        tipo_hook: z.string().optional().describe('Ex: pergunta, choque, estatística, história'),
        estrutura: z.string().optional().describe('Ex: PAS, AIDA, Before/After'),
        hook_video_format: z.string().optional().describe('Ex: UGC, Breaking news, React, Arquibancada'),
        body_video_format: z.string().optional(),
        tags: z.array(z.string()).optional().describe('Status: Rodando, Validada, Teste, Pendente, Rascunho'),
        notas: z.string().optional().describe('Por que essa copy foi criada, hipótese, observações'),
        source_copy_id: z.string().optional().describe('UUID da copy original se for uma variação'),
        product_id: z.string().optional().describe('UUID do produto'),
        extra_hooks: z.array(z.string()).optional().describe('Hooks alternativos'),
        extra_ctas: z.array(z.string()).optional().describe('CTAs alternativos'),
      }),
    },
    async (args) => {
      const isDraft = (args.tags ?? []).includes('Rascunho')
      const { data, error } = await supabase
        .from('copies')
        .insert({
          name: args.nome ?? null,
          business_model: args.modelo,
          hook: args.hook ?? null,
          bridge_sentence: args.bridge_sentence ?? null,
          body: args.body ?? null,
          cta: args.cta ?? null,
          angle: args.angulo ?? null,
          hook_type: args.tipo_hook ?? null,
          structure: args.estrutura ?? null,
          hook_video_format: args.hook_video_format ?? null,
          body_video_format: args.body_video_format ?? null,
          tags: args.tags ?? [],
          notes: args.notas ?? null,
          source_copy_id: args.source_copy_id ?? null,
          product_id: args.product_id ?? null,
          extra_hooks: args.extra_hooks ?? [],
          extra_ctas: args.extra_ctas ?? [],
          extra_bridges: [],
          published_at: isDraft ? null : new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      return {
        content: [{
          type: 'text',
          text: `✅ Copy criada com sucesso!\nID: ${data.id}\nNome: ${data.name ?? '—'}\nModelo: ${data.business_model}`,
        }],
      }
    },
  )

  server.registerTool(
    'criar_variacao',
    {
      title: 'Criar variação',
      description:
        'Atalho para criar uma variação de uma copy existente. Busca a copy original e salva a nova linkada como variação.',
      inputSchema: z.object({
        source_id: z.string().describe('UUID da copy original'),
        hook: z.string().optional(),
        bridge_sentence: z.string().optional(),
        body: z.string().optional(),
        cta: z.string().optional(),
        nome: z.string().optional(),
        notas: z.string().optional().describe('O que mudou em relação ao original'),
        tags: z.array(z.string()).optional(),
      }),
    },
    async (args) => {
      const { data: original, error: errOrig } = await supabase
        .from('copies')
        .select('*')
        .eq('id', args.source_id)
        .single()
      if (errOrig) throw new Error(`Copy original não encontrada: ${errOrig.message}`)

      const { data, error } = await supabase
        .from('copies')
        .insert({
          name: args.nome ?? `Variação de ${original.name ?? original.id.slice(0, 8)}`,
          business_model: original.business_model,
          hook: args.hook ?? original.hook,
          bridge_sentence: args.bridge_sentence ?? original.bridge_sentence,
          body: args.body ?? original.body,
          cta: args.cta ?? original.cta,
          angle: original.angle,
          hook_type: original.hook_type,
          structure: original.structure,
          hook_video_format: original.hook_video_format,
          body_video_format: original.body_video_format,
          product_id: original.product_id,
          tags: args.tags ?? ['Teste'],
          notes: args.notas ?? null,
          source_copy_id: args.source_id,
          extra_hooks: [],
          extra_ctas: [],
          extra_bridges: [],
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      return {
        content: [{
          type: 'text',
          text: `✅ Variação criada!\nID: ${data.id}\nOriginal: ${original.name ?? original.id}\nTag: Teste`,
        }],
      }
    },
  )

  server.registerTool(
    'atualizar_copy',
    {
      title: 'Atualizar copy',
      description: 'Atualiza campos de uma copy existente (ex: adicionar tags, notas, métricas após testar).',
      inputSchema: z.object({
        id: z.string(),
        hook: z.string().optional(),
        body: z.string().optional(),
        cta: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notas: z.string().optional(),
        metrica: z.string().optional().describe('Ex: ROAS 2.8, CTR 4.2%'),
      }),
    },
    async ({ id, ...fields }) => {
      const update: Record<string, unknown> = {}
      if (fields.hook !== undefined) update.hook = fields.hook
      if (fields.body !== undefined) update.body = fields.body
      if (fields.cta !== undefined) update.cta = fields.cta
      if (fields.tags !== undefined) update.tags = fields.tags
      if (fields.notas !== undefined) update.notes = fields.notas
      if (fields.metrica !== undefined) update.metric = fields.metrica

      const { data, error } = await supabase
        .from('copies')
        .update(update)
        .eq('id', id)
        .select('id, name, tags, metric')
        .single()
      if (error) throw new Error(error.message)

      return {
        content: [{
          type: 'text',
          text: `✅ Copy atualizada!\nID: ${data.id}\nNome: ${data.name ?? '—'}\nTags: ${(data.tags ?? []).join(', ')}`,
        }],
      }
    },
  )

  server.registerTool(
    'listar_produtos',
    {
      title: 'Listar produtos',
      description: 'Lista os produtos cadastrados no swipe file com nicho, oferta e avatar.',
      inputSchema: z.object({}),
    },
    async () => {
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (error) throw new Error(error.message)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.registerTool(
    'criar_produto',
    {
      title: 'Criar produto',
      description: 'Cadastra um novo produto no swipe file. Use quando o usuário pedir para adicionar/cadastrar um produto novo.',
      inputSchema: z.object({
        nome: z.string().describe('Nome do produto'),
        nicho: z.string().optional().describe('Ex: sérum anti-acne'),
        oferta: z.string().optional().describe('Preço, desconto, garantia, bônus...'),
        avatar: z.string().optional().describe('Persona para conteúdo orgânico (Non-shop)'),
        descricao: z.string().optional().describe('O que é, como funciona, principais benefícios'),
        ingredientes: z.string().optional().describe('Componentes ativos'),
        dores: z.string().optional().describe('Dores que o produto resolve'),
        publico_alvo: z.string().optional(),
        modelos: z.array(z.enum(BUSINESS_MODELS)).optional().describe('Modelos de negócio em que o produto é usado'),
      }),
    },
    async (args) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: args.nome,
          niche: args.nicho ?? null,
          offer: args.oferta ?? null,
          avatar: args.avatar ?? null,
          description: args.descricao ?? null,
          ingredients: args.ingredientes ?? null,
          pains: args.dores ?? null,
          target_audience: args.publico_alvo ?? null,
          models: args.modelos ?? [],
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      return {
        content: [{ type: 'text', text: `✅ Produto criado com sucesso!\nID: ${data.id}\nNome: ${data.name}` }],
      }
    },
  )
})

// ── Entrada HTTP (com autenticação por bearer token) ────────────────
async function handler(req: NextRequest) {
  if (!checkAuth(req)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    })
  }
  return mcpHandler(req)
}

export { handler as GET, handler as POST, handler as DELETE }
