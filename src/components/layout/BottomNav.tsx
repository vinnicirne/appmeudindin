'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Spacer to prevent content from hiding behind the bottom nav */}
      <div className="h-20 sm:hidden"></div>
      
      {/* Bottom Navigation for Mobile */}
      <nav style={{ pointerEvents: 'auto' }} className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-card flex items-center justify-around px-2 pb-safe z-[9999] border-t border-border/50 tour-bottom-nav">
        <NavItem href="/" icon="home" label="Início" active={pathname === '/'} />
        <NavItem href="/graphics" icon="pie_chart" label="Gráficos" active={pathname === '/graphics'} />
        <NavItem href="/transactions" icon="receipt_long" label="Extrato" active={pathname === '/transactions'} />
        <NavItem href="/planning" icon="account_balance_wallet" label="Metas" active={pathname === '/planning'} />
        <NavItem href="/profile" icon="person" label="Perfil" active={pathname === '/profile'} />
      </nav>
    </>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <button
      type="button" style={{ pointerEvents: 'auto' }}
      onClick={() => {
        console.log('FORCING NAVIGATION TO:', href);
        // Força navegação completa
        window.location.assign(href);
      }}
      className="flex flex-col items-center justify-center gap-1 w-[4.5rem] h-full text-center group relative z-50"
    >
      <div className={`flex items-center justify-center px-3 py-1 rounded-full transition-colors ${
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground group-hover:bg-primary/10'
      }`}>
        <span className={`material-symbols-outlined text-2xl ${active ? 'font-variation-settings-["FILL"_1]' : ''}`}>
          {icon}
        </span>
      </div>
      <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );
}
