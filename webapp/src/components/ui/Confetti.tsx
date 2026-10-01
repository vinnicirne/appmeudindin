'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

interface GoalConfettiProps {
  show: boolean
  onComplete?: () => void
}

export function GoalConfetti({ show, onComplete }: GoalConfettiProps) {
  const { width, height } = useWindowSize()
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (show) {
      setIsRunning(true)
      const timer = setTimeout(() => {
        setIsRunning(false)
        if (onComplete) onComplete()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!isRunning) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={400}
        gravity={0.15}
      />
    </div>
  )
}
