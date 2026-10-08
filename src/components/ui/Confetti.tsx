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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!isRunning) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <Confetti
        width={width === Infinity ? 0 : width}
        height={height === Infinity ? 0 : height}
        recycle={false}
        numberOfPieces={400}
        gravity={0.15}
      />
    </div>
  )
}
