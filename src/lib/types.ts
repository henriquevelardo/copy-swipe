export type BusinessModel = 'TikTok Shop' | 'Non-shop' | 'DTC'
export type NshopLine = 'GMV' | 'Grow'

export const BUSINESS_MODELS: BusinessModel[] = ['TikTok Shop', 'Non-shop', 'DTC']

export const MODEL_COLORS: Record<string, string> = {
  'TikTok Shop': 'bg-teal/10 text-teal dark:bg-teal-dark/15 dark:text-teal-dark',
  'Non-shop':    'bg-plum/10 text-plum dark:bg-plum-dark/15 dark:text-plum-dark',
  'DTC':         'bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark',
}

export const COPY_TAGS = ['Rodando', 'Teste', 'Validada', 'Pendente', 'Rascunho'] as const
export type CopyTag = typeof COPY_TAGS[number]

export const TAG_COLORS: Record<string, string> = {
  'Rodando':  'bg-moss/10 text-moss dark:bg-moss-dark/15 dark:text-moss-dark',
  'Teste':    'bg-amber/10 text-amber dark:bg-amber-dark/15 dark:text-amber-dark',
  'Validada': 'bg-teal/10 text-teal dark:bg-teal-dark/15 dark:text-teal-dark',
  'Pendente': 'bg-ink-soft/10 text-ink-soft dark:bg-ink-soft-dark/15 dark:text-ink-soft-dark',
  'Rascunho': 'bg-plum/10 text-plum dark:bg-plum-dark/15 dark:text-plum-dark',
}

export const TAG_ACTIVE_FILTER: Record<string, string> = {
  'Rodando':  'bg-moss/10 border-moss/30 text-moss dark:bg-moss-dark/15 dark:border-moss-dark/40 dark:text-moss-dark',
  'Teste':    'bg-amber/10 border-amber/30 text-amber dark:bg-amber-dark/15 dark:border-amber-dark/40 dark:text-amber-dark',
  'Validada': 'bg-teal/10 border-teal/30 text-teal dark:bg-teal-dark/15 dark:border-teal-dark/40 dark:text-teal-dark',
  'Pendente': 'bg-ink-soft/10 border-ink-soft/30 text-ink-soft dark:bg-ink-soft-dark/15 dark:border-ink-soft-dark/40 dark:text-ink-soft-dark',
  'Rascunho': 'bg-plum/10 border-plum/30 text-plum dark:bg-plum-dark/15 dark:border-plum-dark/40 dark:text-plum-dark',
}

export interface Annotation {
  id: string
  copy_id: string
  field: string
  selected_text: string
  instruction: string
  headline?: string | null
  created_at: string
}

export const VIDEO_FORMATS = [
  'UGC',
  'Breaking news',
  'React',
  'Arquibancada',
  'TED talk',
  'Cinematográfico',
  'Talk show',
  'Podcast',
  'Monge',
] as const

export type VideoFormat = typeof VIDEO_FORMATS[number]

export interface Product {
  id: string
  name: string
  niche: string | null
  offer: string | null
  avatar: string | null
  description: string | null
  ingredients: string | null
  pains: string | null
  target_audience: string | null
  models: string[]
  image_url: string | null
  created_at: string
}

export interface Copy {
  id: string
  name: string | null
  product_id: string | null
  business_model: BusinessModel
  angle: string | null
  angles: string[]
  headlines: string[]
  hook_type: string | null
  structure: string | null
  hook: string | null
  hook_video_format: string | null
  body: string | null
  body_video_format: string | null
  cta: string | null
  tags: string[]
  extra_hooks: string[]
  extra_ctas: string[]
  bridge_sentence: string | null
  extra_bridges: string[]
  metric: string | null
  notes: string | null
  nshop_line: NshopLine | null
  source_copy_id: string | null
  published_at: string | null
  created_at: string
  product?: Product
}
