'use client'

import { useEffect, useState } from 'react'
import { verifyAppLock } from '@/utils/appLock'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    verifyAppLock().then(ok => {
      if (!mounted) return
      if (ok) {
        setUnlocked(true)
        setVerifying(false)
      } else {
        setVerifying(false)
      }
    })
    return () => { mounted = false }
  }, [])

  function handleRetry() {
    setVerifying(true)
    verifyAppLock().then(ok => {
      if (ok) {
        setUnlocked(true)
      }
      setVerifying(false)
    })
  }

  function handleLogout() {
    router.push('/login') // Força logout (ou você pode bater na API de logout se quiser)
  }

  if (unlocked) {
    return <>{children}</>
  }

  if (verifying) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse mb-4">lock</span>
        <p className="text-muted-foreground font-medium text-sm">Verificando biometria...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center max-w-sm w-full text-center"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-red-500">lock_outline</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">App Bloqueado</h2>
        <p className="text-muted-foreground text-sm mb-8">
          A autenticação biométrica falhou ou foi cancelada. Desbloqueie para acessar seus dados.
        </p>

        <button 
          onClick={handleRetry}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold mb-4 shadow-sm"
        >
          Tentar Novamente
        </button>
        <button 
          onClick={handleLogout}
          className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Sair da Conta
        </button>
      </motion.div>
    </div>
  )
}
