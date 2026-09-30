'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { logoutAction } from '../actions/authActions'

interface Props {
  displayName: string
  email: string
}

const NAV_ITEMS = [
  { href: '/admin', icon: 'dashboard', label: 'Visão Geral', exact: true },
  { href: '/admin/users', icon: 'group', label: 'Usuários', exact: false },
  { href: '/admin/plans', icon: 'payments', label: 'Planos', exact: false },
  { href: '/admin/subscriptions', icon: 'loyalty', label: 'Assinaturas', exact: false },
  { href: '/admin/affiliates', icon: 'handshake', label: 'Afiliados', exact: false },
]

export default function AdminSidebar({ displayName, email }: Props) {
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
    await logoutAction()
    router.push('/login')
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function toggleTheme() {
    const current = resolvedTheme || theme
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  const initials = displayName.slice(0, 2).toUpperCase()
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">$</div>
          <span className="font-bold text-foreground text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted text-foreground transition-colors"
            title="Alternar tema"
          >
            <span className="material-symbols-outlined text-lg">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 bottom-0 w-72 bg-card border-r border-border p-4 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <NavContent
              initials={initials}
              displayName={displayName}
              email={email}
              loading={loading}
              isActive={isActive}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col w-64 shrink-0 bg-card border-r border-border min-h-screen p-5">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow">
              $
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-none">Meu DinDin</p>
              <p className="text-[10px] text-primary font-semibold">Painel Admin</p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            <span className="material-symbols-outlined text-lg">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        <NavContent
          initials={initials}
          displayName={displayName}
          email={email}
          loading={loading}
          isActive={isActive}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile top spacer */}
      <div className="sm:hidden h-14 shrink-0" />
    </>
  )
}

function NavContent({
  initials, displayName, email, loading, isActive, isDark, onToggleTheme, onLogout, onClose
}: {
  initials: string
  displayName: string
  email: string
  loading: boolean
  isActive: (href: string, exact: boolean) => boolean
  isDark: boolean
  onToggleTheme: () => void
  onLogout: () => void
  onClose?: () => void
}) {
  return (
    <>
      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${
              isActive(item.href, item.exact)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}

        <div className="my-3 border-t border-border" />

        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-sm">Voltar ao App</span>
        </Link>
      </nav>

      {/* User info + Theme Toggle + logout */}
      <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
        {/* Theme button inside footer for mobile */}
        <button
          onClick={onToggleTheme}
          className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span>Tema {isDark ? 'Escuro' : 'Claro'}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">Alternar</span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {loading ? 'Saindo...' : 'Sair da conta'}
        </button>
      </div>
    </>
  )
}


