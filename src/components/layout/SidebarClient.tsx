'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  isAdmin?: boolean
  isAffiliate?: boolean
}

export default function SidebarClient({ isAdmin, isAffiliate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex flex-col w-64 bg-card border-r border-border h-full p-4 sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
          $
        </div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Meu DinDin</h1>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <NavItem href="/" icon="home" label="Início" active={pathname === '/'} />
        <NavItem href="/graphics" icon="pie_chart" label="Gráficos" active={pathname === '/graphics'} />
        <NavItem href="/transactions" icon="receipt_long" label="Extrato" active={pathname === '/transactions'} />
        
        {/* Adicionado a Caixinha apenas no Menu Lateral */}
        <NavItem href="/vaults" icon="account_balance" label="Caixinhas" active={pathname === '/vaults'} />
        
        <NavItem href="/planning" icon="savings" label="Metas" active={pathname === '/planning'} />
        <NavItem href="/budgets" icon="donut_large" label="Teto de Gastos" active={pathname === '/budgets'} />
        
        {isAffiliate && (
          <NavItem href="/affiliate" icon="handshake" label="Área de Parceiro" active={pathname === '/affiliate'} />
        )}
        {isAdmin && (
          <NavItem href="/admin" icon="admin_panel_settings" label="Painel Admin" active={pathname.startsWith('/admin')} />
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
        <NavItem href="/profile" icon="person" label="Meu Perfil" active={pathname === '/profile'} />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium ${
        active 
          ? 'bg-primary/10 text-primary font-bold' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
