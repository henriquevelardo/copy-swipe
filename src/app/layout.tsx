import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Copy Swipe',
  description: 'Gerenciador de copies de vídeo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{const s=localStorage.getItem('theme');if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`
        }} />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center gap-6 sticky top-0 z-40">
          <Link href="/" className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Copy Swipe
          </Link>
          <Link href="/products" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Produtos
          </Link>
          <Link href="/criar" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Criar
          </Link>
          <Link href="/comparar" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Comparar
          </Link>
          <ThemeToggle />
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
