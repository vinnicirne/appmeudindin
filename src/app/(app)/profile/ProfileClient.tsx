'use client';

import { motion } from 'framer-motion';
import { logoutAction } from '@/app/actions/authActions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { requestForToken } from '@/utils/firebase/firebase';
import { toast } from 'react-hot-toast';

interface Props {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  planStatus: string;
  createdAt: string;
}

export default function ProfileClient({
  userId,
  displayName,
  email,
  phone,
  role,
  planStatus,
  createdAt,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  

  const initials = (displayName.trim().slice(0, 2) || email.slice(0, 2) || '?').toUpperCase();
  const isActive = planStatus === 'active';

  async function handleLogout() {
    setLoading(true);
    const res = await logoutAction();
    setLoading(false);

    if (res?.error) {
      toast.error("Erro ao sair: " + res.error);
    } else {
      router.push('/login');
      router.refresh();
    }
  }

  async function handleTogglePush() {
    toast.loading('Configurando notificações...', { id: 'push-profile' });
    try {
      const { token, error } = await requestForToken();
      if (!token) {
        toast.error(error || 'Permissão negada ou não suportado.', { id: 'push-profile' });
        return;
      }

      const apiRes = await fetch('/api/push/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const res = await apiRes.json().catch(() => ({}));
      
      if (!apiRes.ok || !res.success) {
        toast.error(res.error || 'Erro ao salvar token.', { id: 'push-profile' });
        return;
      }

      toast.success('Notificações ativadas com sucesso!', { id: 'push-profile' });
    } catch (e) {
      toast.error('Falha ao configurar notificações.', { id: 'push-profile' });
    }
  }

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 px-2">
        <h1 className="text-xl font-bold text-foreground">Meu Perfil</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 mb-4 flex flex-col items-center gap-3 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-black shadow-md">
          {initials}
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          {phone && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#1db576]">call</span>
              {phone}
            </p>
          )}
          {role === 'admin' && (
            <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
              Administrador
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-3xl p-5 border border-primary/20 shadow-sm mb-4 flex items-center justify-between"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-lg ${isActive ? 'text-[#1db576]' : 'text-amber-500'}`}>
              {isActive ? 'verified' : 'pending'}
            </span>
            <span className="font-bold text-sm text-foreground">
              {isActive ? 'Plano Ativo' : 'Assinatura Pendente'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Assinatura Anual (R$ 37,00)</span>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${
          isActive ? 'bg-[#1db576]/10 text-[#1db576]' : 'bg-amber-500/10 text-amber-600'
        }`}>
          {isActive ? 'Ativo' : 'Pendente'}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3 mb-6"
      >
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                <span className="material-symbols-outlined text-sm">dark_mode</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Tema Escuro</p>
                <p className="text-[10px] text-muted-foreground">Alternar aparência</p>
              </div>
            </div>
            <ThemeToggle />
          </div>


          <button 
            onClick={handleTogglePush}
            className="w-full flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Notificações</p>
                <p className="text-[10px] text-muted-foreground">Alertas no dispositivo</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-sm">chevron_right</span>
          </button>

          <button 
            onClick={() => setShowDataModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                <span className="material-symbols-outlined text-sm">database</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Meus Dados</p>
                <p className="text-[10px] text-muted-foreground">Exportar ou visualizar</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-sm">chevron_right</span>
          </button>
        </div>

        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
          <Link href="/help" className="flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground">
                <span className="material-symbols-outlined text-sm">help</span>
              </div>
              <p className="text-sm font-bold text-foreground">Ajuda e Suporte</p>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-sm">chevron_right</span>
          </Link>
          
          {role === 'admin' && (
            <Link href="/admin" className="flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-500">Painel Admin</p>
                  <p className="text-[10px] text-amber-500/70">Acesso restrito</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-amber-500 text-sm">chevron_right</span>
            </Link>
          )}

          <button 
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <span className="material-symbols-outlined text-sm">logout</span>
              </div>
              <p className="text-sm font-bold text-red-500">Sair da conta</p>
            </div>
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-red-500 text-sm">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-red-500 text-sm">chevron_right</span>
            )}
          </button>
        </div>
      </motion.div>

      {showDataModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-modal-title"
          onClick={() => setShowDataModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowDataModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border/50 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id="data-modal-title" className="font-bold text-foreground text-lg">Seus Dados</h3>
              <button onClick={() => setShowDataModal(false)} className="text-muted-foreground hover:text-foreground bg-muted w-8 h-8 flex items-center justify-center rounded-full transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-muted p-4 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">ID da Conta</p>
                <p className="text-xs font-mono text-foreground break-all">{userId}</p>
              </div>
              <div className="bg-muted p-4 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Criado em</p>
                <p className="text-sm font-medium text-foreground">{createdAt ? new Date(createdAt).toLocaleString('pt-BR') : 'Desconhecido'}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-6">
              Para exportar todas as suas transações, acesse a aba "Lançamentos" e use o botão de exportar (CSV).
            </p>

            <button 
              onClick={() => setShowDataModal(false)}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              Entendi
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
