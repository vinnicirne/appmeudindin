'use client'

import { useEffect, useState } from 'react'
import { Joyride, STATUS } from 'react-joyride'
import { useTheme } from 'next-themes'

export function OnboardingTour() {
  const [run, setRun] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    // Verifica se já fez o tour antes
    const hasCompletedTour = localStorage.getItem('meu-dindin-tour-completed')
    if (!hasCompletedTour) {
      // Delay pequeno para garantir que a UI rendeu
      setTimeout(() => setRun(true), 1000)
    }
  }, [])

  const steps: any[] = [
    {
      target: '.tour-balance',
      content: 'Bem-vindo ao Meu DinDin! 🚀 Aqui você acompanha o resumo do seu dinheiro no mês atual.',
      disableBeacon: true,
    },
    {
      target: '.tour-quick-add',
      content: 'Use estes botões rápidos para registrar uma nova Receita ou Despesa em segundos.',
    },
    {
      target: '.tour-bottom-nav',
      content: 'Navegue pelas áreas do app: analise gráficos, veja seu extrato completo ou defina metas para o futuro!',
    },
    {
      target: '.tour-fab',
      content: 'Dica de Ouro: Este botão flutuante te acompanha em todas as telas para adicionar registros a qualquer momento. Experimente!',
    }
  ]

  const handleJoyrideCallback = (data: any) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      localStorage.setItem('meu-dindin-tour-completed', 'true')
    }
  }

  const isDark = theme === 'dark'

  return (
    <Joyride
      {...({
        onEvent: handleJoyrideCallback,
        continuous: true,
        hideCloseButton: true,
        run: run,
        scrollToFirstStep: true,
        showProgress: true,
        showSkipButton: true,
        steps: steps,
        styles: {
          options: {
            zIndex: 10000,
            primaryColor: '#1db576',
            textColor: isDark ? '#f8fafc' : '#0f172a',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            arrowColor: isDark ? '#1e293b' : '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.6)'
          },
          buttonNext: {
            backgroundColor: '#1db576',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: isDark ? '#94a3b8' : '#64748b',
          },
          buttonSkip: {
            color: isDark ? '#94a3b8' : '#64748b',
          }
        },
        locale: {
          back: 'Voltar',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Pular Tour'
        }
      } as any)}
    />
  )
}
