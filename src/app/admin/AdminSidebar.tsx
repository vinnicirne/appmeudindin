'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { logoutAction } from '../actions/authActions'
import { toast } from 'react-hot-toast'

interface Props {
  displayName?: string
  email?: string
}

const NAV_ITEMS = [
  { href: '/admin', icon: 'dashboard', label: 'Visão Geral', exact: true },
  { href: '/admin/users', icon: 'group', label: 'Usuários', exact: false },
  { href: '/admin/plans', icon: 'payments', label: 'Planos', exact: false },
  { href: '/admin/subscriptions', icon: 'loyalty', label: 'Assinaturas', exact: false },
  { href: '/admin/affiliates', icon: 'handshake', label: 'Afiliados', exact: false },
  { href: '/admin/categories', icon: 'category', label: 'Categorias', exact: false },
]

export default function AdminSidebar({ displayName = 'Admin', email = 'admin' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    setLoading(true)
    try {
      const res = await logoutAction()
      if (res?.error) throw new Error(res.error)
    } catch (e: any) {
      toast.error('Erro ao sair: ' + e.message)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function toggleTheme() {
    const current = resolvedTheme || theme
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <button 
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 sm:hidden w-10 h-10 bg-card border border-border/50 rounded-xl flex items-center justify-center text-foreground shadow-sm"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 sm:hidden backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 w-64 h-full bg-background border-r border-border/50 flex flex-col p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-black text-xl text-primary tracking-tighter">Meu DinDin <span className="text-foreground font-normal">Admin</span></h1>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
              {NAV_ITEMS.map(item => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'}`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-border/50 pt-4 flex flex-col gap-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Voltar ao App
              </Link>
              
              <button onClick={toggleTheme} className="flex items-center justify-between px-4 py-3 rounded-xl text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors w-full text-left">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">{mounted && resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                  Alternar Tema
                </div>
              </button>

              <button 
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-medium hover:bg-red-500/10 transition-colors w-full text-left"
              >
                {loading ? <span className="material-symbols-outlined text-lg animate-spin">refresh</span> : <span className="material-symbols-outlined text-lg">logout</span>}
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden sm:flex w-64 h-screen flex-shrink-0 flex-col bg-card border-r border-border/50 p-6 sticky top-0">
        <h1 className="font-black text-2xl text-primary tracking-tighter mb-8 pl-2">Meu DinDin <span className="text-foreground font-normal">Admin</span></h1>

        <nav className="flex-1 flex flex-col gap-2">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${active ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'}`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border/50 pt-6 flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Voltar ao App
          </Link>
          
          <button onClick={toggleTheme} className="flex items-center justify-between px-4 py-3 rounded-2xl text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors w-full text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">{mounted && resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              Alternar Tema
            </div>
          </button>

          <button 
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 font-medium hover:bg-red-500/10 transition-colors w-full text-left"
          >
            {loading ? <span className="material-symbols-outlined text-xl animate-spin">refresh</span> : <span className="material-symbols-outlined text-xl">logout</span>}
            Sair
          </button>

          <div className="mt-4 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
