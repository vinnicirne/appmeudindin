'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Show toast for Android/Desktop
    if (deferredPrompt) {
      toast.custom(
        (t) => (
          <div className="bg-card border border-primary/20 shadow-xl rounded-2xl p-4 flex flex-col gap-3 max-w-sm w-full mx-4 pointer-events-auto">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-foreground text-2xl">
                  download
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-sm">Instalar Meu DinDin</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione o app à sua tela inicial para acesso rápido e melhor experiência.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                  }
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                Instalar App
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: 'bottom-center',
          id: 'install-pwa',
        }
      );
    }
  }, [deferredPrompt]);

  useEffect(() => {
    // Show toast for iOS (doesn't support beforeinstallprompt)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (isIOS && !isStandalone) {
      const hasSeenToast = localStorage.getItem('ios_pwa_toast_seen');
      if (!hasSeenToast) {
        toast.custom(
          (t) => (
            <div className="bg-card border border-primary/20 shadow-xl rounded-2xl p-4 flex flex-col gap-3 max-w-sm w-full mx-4 pointer-events-auto text-center">
              <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-foreground text-2xl">
                  ios_share
                </span>
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Instalar no iPhone</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Toque em <b>Compartilhar</b> e depois em <br />
                  <b>Adicionar à Tela de Início</b>.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('ios_pwa_toast_seen', 'true');
                  toast.dismiss(t.id);
                }}
                className="w-full py-2 mt-1 rounded-xl text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
              >
                Entendi
              </button>
            </div>
          ),
          {
            duration: 10000,
            position: 'bottom-center',
            id: 'install-pwa-ios',
          }
        );
      }
    }
  }, [isIOS]);

  return null;
}
