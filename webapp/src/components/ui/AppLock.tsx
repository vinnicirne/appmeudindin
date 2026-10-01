'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

export function AppLock() {
  const [isLocked, setIsLocked] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const lockEnabled = localStorage.getItem('meu-dindin-applock') === 'true'
    if (lockEnabled) {
      setIsLocked(true)
      // Automatically prompt biometrics on mount if locked
      setTimeout(() => {
        handleUnlock()
      }, 500)
    } else {
      setIsLocked(false)
    }
    setIsChecking(false)
  }, [])

  async function handleUnlock() {
    try {
      if (!window.PublicKeyCredential) {
        // Fallback for browsers that don't support it, just unlock
        setIsLocked(false)
        return
      }

      const storedId = localStorage.getItem('meu-dindin-applock-id')
      if (!storedId) {
        setIsLocked(false)
        return
      }

      const rawIdArray = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: rawIdArray,
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000,
        }
      })

      if (assertion) {
        setIsLocked(false) // Unlocked successfully!
      }
    } catch (error) {
      console.error("Biometria falhou ou foi cancelada", error)
      toast.error('Autenticação necessária para acessar o aplicativo.')
    }
  }

  if (isChecking) return null

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[48px]">fingerprint</span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">App Bloqueado</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Meu DinDin está protegido por biometria. Confirme sua identidade para acessar seus dados financeiros.
              </p>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">lock_open</span>
              Desbloquear App
            </button>
            
            <p className="text-[10px] text-muted-foreground mt-4 opacity-60">
              Usa WebAuthn (FaceID/TouchID/Windows Hello)
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
