'use client'

import { ReactNode } from 'react'

export function SwipeNavigation({ children }: { children: ReactNode }) {
  // Desativado por questões de performance no touch (causava travamentos)
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
      {children}
    </div>
  )
}
