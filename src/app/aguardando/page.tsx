'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type WaitState = 'pending' | 'active' | 'error'

import { Suspense } from 'react'

export default function AguardandoPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></main>}>
      <AguardandoPage />
    </Suspense>
  )
}

function AguardandoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [waitState, setWaitState] = useState<WaitState>('pending')
  const [dots, setDots] = useState('.')
  const statusParam = searchParams.get('status')
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')

  // Se houver payment_id nos parâmetros da URL (retorno do Mercado Pago), valida ativamente
  useEffect(() => {
    if (!paymentId) return

    const verifyDirectly = async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        })
        const data = await res.json()
        if (data.status === 'approved' || data.success) {
          setWaitState('active')
          setTimeout(() => router.replace('/'), 2000)
        }
      } catch (err) {
        console.warn('[Aguardando] Falha na verificação direta de pagamento:', err)
      }
    }

    verifyDirectly()
  }, [paymentId, router])

  // Animação dos pontinhos "Verificando..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const checkAndRedirect = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usuário não está logado — faz login automático não é possível aqui
        // Aguarda o webhook ativar e instrui o usuário a fazer login
        setWaitState('pending')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('plan_status')
        .eq('id', user.id)
        .single()

      if (userData?.plan_status === 'active') {
        setWaitState('active')
        // Pequeno delay para mostrar o sucesso antes de redirecionar
        setTimeout(() => {
          router.replace('/')
        }, 2000)
      }
    } catch {
      // Silencioso — o polling continua
    }
  }, [router])

  // Polling a cada 3 segundos (fallback caso o Realtime não funcione)
  useEffect(() => {
    // Verifica imediatamente ao carregar
    checkAndRedirect()

    const interval = setInterval(checkAndRedirect, 3000)
    return () => clearInterval(interval)
  }, [checkAndRedirect])

  // Supabase Realtime — escuta mudanças na tabela users em tempo real
  useEffect(() => {
    const supabase = createClient()

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('plan-status-watch')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new?.plan_status === 'active') {
              setWaitState('active')
              setTimeout(() => router.replace('/'), 2000)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupRealtime()
    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [router])

  if (waitState === 'active') {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-[#1db576]/15 flex items-center justify-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="material-symbols-outlined text-5xl text-[#1db576]"
            >
              check_circle
            </motion.span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Pagamento Confirmado! 🎉</h1>
            <p className="text-muted-foreground font-medium">
              Sua conta está ativa. Redirecionando para o app...
            </p>
          </div>
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center text-center gap-6"
      >
        {/* Ícone animado */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">
              {statusParam === 'pending' ? 'schedule' : 'payments'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            {statusParam === 'pending'
              ? 'Pagamento em processamento'
              : 'Confirmando seu pagamento'}
          </h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            {statusParam === 'pending'
              ? 'Seu pagamento está sendo processado pelo Mercado Pago. Isso pode levar alguns minutos.'
              : 'Estamos verificando a confirmação do seu pagamento. Por favor, aguarde.'
            }
          </p>
        </div>

        {/* Card de status */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Verificando pagamento{dots}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Assim que confirmarmos o pagamento, você será redirecionado automaticamente para o app, sem precisar fazer nada.
          </p>
        </div>

        {/* Instruções para pagamento pendente */}
        {statusParam === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-warning/10 border border-warning/30 rounded-2xl p-4 text-left"
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-warning text-lg shrink-0 mt-0.5">info</span>
              <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                Boleto ou Pix pode levar até 3 dias úteis para ser confirmado. Vocêê receberá um e-mail quando o acesso for liberado.
              </p>
            </div>
          </motion.div>
        )}

        {/* Link de fallback */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">
            Já pagou e não está sendo redirecionado?
          </p>
          <Link
            href="/login"
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Ir para o Login</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
