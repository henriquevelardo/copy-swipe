import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Mono } from 'next/font/google'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import MainContainer from '@/components/MainContainer'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans',
})
const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'], weight: ['600', '700'], variable: '--font-plex-condensed',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  title: 'Copy Swipe',
  description: 'Gerenciador de copies de vídeo',
}

const navLinks = [
  { href: '/', label: 'Swipe' },
  { href: '/products', label: 'Produtos' },
  { href: '/criar', label: 'Criar' },
  { href: '/comparar', label: 'Comparar' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{const s=localStorage.getItem('theme');if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`
        }} />
      </head>
      <body className="h-screen flex flex-col overflow-hidden bg-paper dark:bg-paper-dark font-sans antialiased">
        <nav className="flex-shrink-0 bg-card dark:bg-card-dark border-b border-line dark:border-line-dark px-6 py-3 flex items-center gap-1 z-40">
          <Link href="/" className="font-display font-bold text-base text-ink dark:text-ink-dark tracking-tight mr-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
            Copy Swipe
          </Link>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="tab-label px-3 py-1.5 rounded text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark hover:bg-paper dark:hover:bg-paper-dark transition-colors">
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
        <MainContainer>{children}</MainContainer>
      </body>
    </html>
  )
}
