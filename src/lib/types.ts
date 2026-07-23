export type BusinessModel = 'TikTok Shop' | 'Non-shop' | 'DTC'
export type NshopLine = 'GMV' | 'Grow'

export const BUSINESS_MODELS: BusinessModel[] = ['TikTok Shop', 'Non-shop', 'DTC']

export const MODEL_COLORS: Record<string, string> = {
  'TikTok Shop': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Non-shop':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'DTC':         'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export const COPY_TAGS = ['Rodando', 'Teste', 'Validada', 'Pendente', 'Rascunho'] as const
export type CopyTag = typeof COPY_TAGS[number]

export const TAG_COLORS: Record<string, string> = {
  'Rodando':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Teste':    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Validada': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Pendente': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  'Rascunho': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export const TAG_ACTIVE_FILTER: Record<string, string> = {
  'Rodando':  'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400',
  'Teste':    'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400',
  'Validada': 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400',
  'Pendente': 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
  'Rascunho': 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400',
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
