'use client';

import { motion } from 'framer-motion';
import { logoutAction } from '@/app/actions/authActions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { requestForToken } from '@/utils/firebase/firebase';
import { saveFcmToken } from '@/app/actions/pushActions';
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
  
  // App Lock State
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  // Load app lock state on mount
  useEffect(() => {
    setAppLockEnabled(localStorage.getItem('meu-dindin-applock') === 'true');
  }, []);

  async function handleToggleAppLock() {
    try {
      if (appLockEnabled) {
        localStorage.removeItem('meu-dindin-applock');
        setAppLockEnabled(false);
        toast.success('Bloqueio do app desativado.');
        return;
      }

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        toast.error('Seu dispositivo ou navegador não suporta biometria.');
        return;
      }

      // Create a dummy credential to register the device/biometrics
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBuffer = new Uint8Array(16);
      window.crypto.getRandomValues(userIdBuffer);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: "Meu DinDin", id: window.location.hostname },
          user: {
            id: userIdBuffer,
            name: email,
            displayName: displayName
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
        }
      }) as PublicKeyCredential;

      if (credential && credential.rawId) {
        // Encode rawId to base64 safely
        const rawIdArray = Array.from(new Uint8Array(credential.rawId));
        const base64Id = btoa(String.fromCharCode.apply(null, rawIdArray));
        localStorage.setItem('meu-dindin-applock-id', base64Id);
        localStorage.setItem('meu-dindin-applock', 'true');
        setAppLockEnabled(true);
        toast.success('Biometria ativada com sucesso!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Operação cancelada ou falhou.');
    }
  }

  const initials = displayName.slice(0, 2).toUpperCase();
  const isActive = planStatus === 'active';

  async function handleLogout() {
    setLoading(true);
    const res = await logoutAction();
    setLoading(false);

    if (res?.error) {
      alert("Erro ao sair: " + res.error);
    } else {
      router.push('/login');
    }
  }

  async function handleTogglePush() {
    toast.loading('Configurando notificações...', { id: 'push-profile' });
    try {
      const { token, error } = await requestForToken();
      if (token) {
        const apiRes = await fetch('/api/push/save-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); const res = await apiRes.json();
        if (res.success) {
          toast.success('Notificações ativadas com sucesso!', { id: 'push-profile' });
        } else {
          toast.error('Erro ao salvar no banco. ' + res.error, { id: 'push-profile' });
        }
      } else {
        toast.error(error || 'Permissão negada ou não suportado.', { id: 'push-profile' });
      }
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

      {/* Profile Card */}
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

      {/* Subscription Status */}
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
          <span className="text-xs text-muted-foreground font-medium">Assinatura Anual (R$ 29,00)</span>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${
          isActive ? 'bg-[#1db576]/10 text-[#1db576]' : 'bg-amber-500/10 text-amber-600'
        }`}>
          {isActive ? 'Ativo' : 'Pendente'}
        </div>
      </motion.div>

      {/* Menu Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3 mb-6"
      >
        {/* Meus Dados de Cadastro */}
        <button
          onClick={() => setShowDataModal(true)}
          className="bg-card w-full p-4 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm hover:bg-muted transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground block">Meus Dados</span>
              <span className="text-[11px] text-muted-foreground">Nome, e-mail, telefone e cadastro</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
        </button>

        <ThemeToggle />

        {/* Bloqueio do App (Biometria) */}
        <button
          onClick={handleToggleAppLock}
          className="bg-card w-full p-4 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm hover:bg-muted transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${appLockEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              <span className="material-symbols-outlined text-[20px]">
                {appLockEnabled ? 'fingerprint' : 'lock_open'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground block">Segurança do App</span>
              <span className="text-[11px] text-muted-foreground">
                {appLockEnabled ? 'Biometria Ativada' : 'Biometria Desativada'}
              </span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${appLockEnabled ? 'bg-emerald-500 justify-end' : 'bg-muted-foreground/30 justify-start'}`}>
            <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </div>
        </button>

        {/* Notificações Push (Serviço Reativado) */}
        <button
          onClick={handleTogglePush}
          className="bg-card w-full p-4 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm hover:bg-muted transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground block">Notificações</span>
              <span className="text-[11px] text-muted-foreground">Ativar alertas e lembretes</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
        </button>

        {/* Link para admin — só aparece para admins */}
        {role === 'admin' && (
          <Link
            href="/admin"
            className="bg-card w-full p-4 rounded-2xl flex items-center justify-between border border-primary/30 shadow-sm hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </div>
              <span className="font-semibold text-sm text-foreground">Painel Admin</span>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
          </Link>
        )}
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-auto px-1"
      >
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {loading ? 'Saindo...' : 'Sair da conta'}
        </button>
      </motion.div>

      {/* Modal: Meus Dados de Cadastro */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                <h3 className="font-bold text-base text-foreground">Dados de Cadastro</h3>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border/40">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-0.5">Nome Completo</span>
                <p className="font-bold text-sm text-foreground">{displayName || 'Não informado'}</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border/40">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-0.5">E-mail</span>
                <p className="font-bold text-sm text-foreground">{email}</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border/40">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-0.5">WhatsApp / Telefone</span>
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#1db576]">chat</span>
                  {phone || 'Não cadastrado'}
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border/40">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-0.5">Status da Conta</span>
                <p className="font-bold text-xs text-foreground">
                  {isActive ? '✅ Assinatura Ativa' : '⏳ Aguardando Pagamento'}
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border/40">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block mb-0.5">Data de Criação</span>
                <p className="font-medium text-xs text-muted-foreground">
                  {createdAt ? new Date(createdAt).toLocaleString('pt-BR') : '—'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDataModal(false)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-xs hover:bg-primary/90 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
