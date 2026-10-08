'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from 'cn'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const toggleOpen = () => {
    const next = !isOpen
    setIsOpen(next)
  }

  const handleAction = (type: 'INCOME' | 'EXPENSE') => {
    setIsOpen(false)
    router.push(`/add?type=${type}`)
  }

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-3 tour-fab">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            className="flex flex-col gap-3 items-end mb-2"
          >
            <button
              onClick={() => handleAction('INCOME')}
              className="flex items-center gap-3 bg-card border border-border shadow-lg p-2 pr-4 rounded-full hover:bg-muted transition-colors group"
            >
              <span className="font-bold text-sm text-foreground">Receita</span>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined">arrow_upward</span>
              </div>
            </button>
            <button
              onClick={() => handleAction('EXPENSE')}
              className="flex items-center gap-3 bg-card border border-border shadow-lg p-2 pr-4 rounded-full hover:bg-muted transition-colors group"
            >
              <span className="font-bold text-sm text-foreground">Despesa</span>
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined">arrow_downward</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-primary-foreground transition-colors",
          isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        )}
      >
        <span className="material-symbols-outlined text-[32px]">
          add
        </span>
      </motion.button>
    </div>
  )
}
