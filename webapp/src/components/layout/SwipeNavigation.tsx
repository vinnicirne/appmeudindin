'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSwipeable } from 'react-swipeable'
import { ReactNode } from 'react'

// Ordem das páginas no BottomNav para navegação lógica (Esquerda/Direita)
const ROUTES = [
  '/',
  '/graphics',
  '/transactions',
  '/planning',
  '/profile'
]

export function SwipeNavigation({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handlers = useSwipeable({
    onSwipedLeft: (event) => {
      // Ignorar se o usuário estiver arrastando um card de transação (Framer Motion drag)
      if ((event.event.target as HTMLElement).closest('[style*="transform"]')) return;

      const currentIndex = ROUTES.indexOf(pathname)
      if (currentIndex !== -1 && currentIndex < ROUTES.length - 1) {
        router.push(ROUTES[currentIndex + 1])
      }
    },
    onSwipedRight: (event) => {
      if ((event.event.target as HTMLElement).closest('[style*="transform"]')) return;

      const currentIndex = ROUTES.indexOf(pathname)
      if (currentIndex > 0) {
        router.push(ROUTES[currentIndex - 1])
      }
    },
    delta: 80, // Distância mínima do arraste para considerar como "mudança de página"
    preventScrollOnSwipe: false,
    trackMouse: false // Não rastrear mouse no desktop para evitar navegações acidentais
  })

  return (
    <div {...handlers} className="flex-1 flex flex-col min-h-0 overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
      {children}
    </div>
  )
}
