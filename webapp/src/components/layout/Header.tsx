'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { requestForToken } from '@/utils/firebase/firebase';
import { toast } from 'react-hot-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearchClick() {
    router.push('/transactions');
  }

  async function handleNotificationsClick() {
    toast.loading('Configurando notificações...', { id: 'push' });
    try {
      const { token, error } = await requestForToken();
      if (token) {
        const apiRes = await fetch('/api/push/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const res = await apiRes.json();
        if (res?.success) {
          toast.success('Notificações ativadas com sucesso!', { id: 'push' });
        } else {
          toast.error(res?.error || 'Erro ao salvar no banco.', { id: 'push' });
        }
      } else {
        toast.error(error || 'Permissão negada ou não suportado.', { id: 'push' });
      }
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao configurar notificações.', { id: 'push' });
    }
  }

  return (
    <>
      <header className="sm:hidden flex items-center justify-between p-4 bg-background border-b border-border/50 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
            $
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Meu DinDin</h1>
        </Link>
        
        <div className="flex items-center gap-1 text-foreground">
          <button 
            onClick={handleSearchClick}
            title="Buscar Lançamentos"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          
          <button 
            onClick={handleNotificationsClick}
            title="Alertas & Notificações"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </button>

          <button
            onClick={() => setIsMenuOpen(true)}
            title="Mais Opções"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground ml-1"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
        </div>
      </header>

      {/* Menu Gaveta Mobile (Drawer) */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Gaveta lateral deslizante */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Topo da Gaveta */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                      $
                    </div>
                    <span className="font-extrabold text-lg text-foreground">Menu</span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                {/* Links do Menu */}
                <nav className="flex flex-col gap-2">
                  <DrawerItem 
                    href="/" 
                    icon="home" 
                    label="Início" 
                    active={pathname === '/'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <DrawerItem 
                    href="/planning" 
                    icon="savings" 
                    label="Metas & Sonhos" 
                    active={pathname === '/planning'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <DrawerItem 
                    href="/budgets" 
                    icon="donut_large" 
                    label="Teto de Gastos" 
                    active={pathname === '/budgets'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <DrawerItem 
                    href="/graphics" 
                    icon="pie_chart" 
                    label="Gráficos & Relatórios" 
                    active={pathname === '/graphics'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <DrawerItem 
                    href="/transactions" 
                    icon="receipt_long" 
                    label="Extrato Completo" 
                    active={pathname === '/transactions'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <DrawerItem 
                    href="/profile" 
                    icon="person" 
                    label="Meu Perfil" 
                    active={pathname === '/profile'} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                </nav>
              </div>

              {/* Rodapé da Gaveta */}
              <div className="pt-6 border-t border-border flex flex-col gap-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aparência</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Modo Escuro / Claro</span>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerItem({ href, icon, label, active = false, onClick }: { href: string; icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
