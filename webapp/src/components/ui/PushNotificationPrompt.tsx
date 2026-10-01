'use client'

import { useEffect, useState } from 'react'
import { requestForToken } from '@/utils/firebase/firebase'
import { saveFcmToken } from '@/app/actions/pushActions'
import { toast } from 'react-hot-toast'

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  async function handleAccept() {
    setShowPrompt(false)
    toast.loading('Configurando avisos...', { id: 'push-prompt' })
    try {
      const { token, error } = await requestForToken()
      if (token) {
        let saved = false
        // Tenta Server Action
        try {
          const res = await saveFcmToken(token)
          if (res?.success) saved = true
        } catch (e) {
          console.warn('Fallback para API route de push...')
        }

        // Se falhou (cache PWA antigo dando 404 em server action), chama API REST direta
        if (!saved) {
          const apiRes = await fetch('/api/push/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          })
          const apiData = await apiRes.json()
          if (apiData?.success) saved = true
        }

        if (saved) {
          toast.success('Pronto! Avisos ativados com sucesso.', { id: 'push-prompt' })
        } else {
          toast.error('Erro ao salvar no banco. (SQL aplicado?)', { id: 'push-prompt' })
        }
      } else {
        toast.error(error || 'Permissão não concedida.', { id: 'push-prompt' })
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao configurar.', { id: 'push-prompt' })
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-3 text-center mb-16 sm:mb-0 slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 relative">
          <span className="material-symbols-outlined text-3xl animate-bounce">notifications_active</span>
          <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card"></span>
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">Ative os Alertas!</h3>
        <p className="text-sm text-muted-foreground font-medium mb-2 px-2">
          Seja avisado exatamente quando sua fatura vencer ou quando o seu pagamento cair na conta.
        </p>
        
        <div className="flex flex-col gap-2 w-full mt-2">
          <button 
            onClick={handleAccept} 
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
          >
            Sim, quero receber avisos
          </button>
          <button 
            onClick={() => setShowPrompt(false)} 
            className="w-full py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
