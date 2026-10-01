'use client';

import { useRouter } from 'next/navigation';
import { requestForToken } from '@/utils/firebase/firebase';
import { toast } from 'react-hot-toast';

export function Header() {
  const router = useRouter();

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
    <header className="sm:hidden flex items-center justify-between p-4 bg-background border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
          $
        </div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Meu DinDin</h1>
      </div>
      
      <div className="flex items-center gap-2 text-foreground">
        <button 
          onClick={handleSearchClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        
        <button 
          onClick={handleNotificationsClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative"
        >
          <span className="material-symbols-outlined text-[26px]">notifications</span>
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
        </button>
      </div>
    </header>
  );
}
