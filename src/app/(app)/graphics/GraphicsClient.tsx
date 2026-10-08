'use client'

import { motion } from "framer-motion"
import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

// Isola o Recharts para nÃ£o travar a navegaÃ§Ã£o (ssr: false)
const ChartsSection = dynamic(() => import('./GraphicsCharts'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full flex items-center justify-center text-sm text-muted-foreground">
      Carregando grÃ¡ficos...
    </div>
  )
})

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  category_id: string
  notes?: string
  is_paid?: boolean
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

import { parseDateParts } from '@/lib/dateUtils'
import { buildCategoryMap, buildCategoryColorsMap } from '@/lib/categoryUtils'

import { useDashboardData } from '@/hooks/useDashboardData'

export default function GraphicsClient() {
  const { data, isLoading } = useDashboardData()
  const transactions = data?.transactions || []
  const dbCategories = data?.categories || []


  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  // TransaÃ§Ãµes do mÃªs selecionado
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const parts = parseDateParts(t.date)
      if (!parts) return false
      return parts.year === year && parts.month === month
    })
  }, [transactions, year, month])

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)
  }, [currentMonthTransactions])

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)
  }, [currentMonthTransactions])

  const balance = totalIncome - totalExpense

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyAverage = totalExpense > 0 ? totalExpense / daysInMonth : 0
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  // Cores hex para o Recharts
  const tailwindToHex: Record<string, string> = {
    'emerald': '#10b981', 'blue': '#3b82f6', 'purple': '#8b5cf6', 'green': '#22c55e',
    'pink': '#ec4899', 'rose': '#f43f5e', 'indigo': '#6366f1', 'teal': '#14b8a6',
    'orange': '#f97316', 'amber': '#f59e0b', 'red': '#ef4444', 'cyan': '#06b6d4', 'gray': '#6b7280'
  }

  function getHexColor(twClass: string) {
    if (!twClass) return '#9ca3af'
    const found = Object.keys(tailwindToHex).find(key => twClass.includes(key))
    return found ? tailwindToHex[found] : '#9ca3af'
  }

  // Despesas por categoria
  const categoryExpenses = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'EXPENSE')
    const grouped: Record<string, number> = {}

    expenses.forEach(t => {
      const cat = t.category_id || 'outros'
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount || 0)
    })

    return Object.entries(grouped)
      .map(([catKey, amount]) => {
        const dbCat = dbCategories.find(c => c.slug === catKey || c.id === catKey)
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        const colorClass = dbCat?.color || 'bg-gray-400'
        return {
          key: catKey,
          label: dbCat?.label || dbCat?.name || dbCat?.title || catKey.charAt(0).toUpperCase() + catKey.slice(1),
          icon: dbCat?.icon || 'category',
          color: colorClass,
          hex: getHexColor(colorClass),
          amount,
          percentage
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [currentMonthTransactions, totalExpense, dbCategories])

  // EvoluÃ§Ã£o dos Ãºltimos 6 meses
  const sixMonthsHistory = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      let targetMonth = month - i
      let targetYear = year
      while (targetMonth < 0) {
        targetMonth += 12
        targetYear -= 1
      }

      const mTransactions = transactions.filter(t => {
        const parts = parseDateParts(t.date)
        if (!parts) return false
        return parts.year === targetYear && parts.month === targetMonth
      })

      const inc = mTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((a, t) => a + Number(t.amount || 0), 0)
      const exp = mTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((a, t) => a + Number(t.amount || 0), 0)

      months.push({
        label: MONTH_SHORT[targetMonth],
        income: inc,
        expense: exp,
        isCurrent: i === 0
      })
    }
    return months
  }, [transactions, year, month])

  // Dica inteligente
  const tipText = useMemo(() => {
    if (totalIncome === 0 && totalExpense === 0) {
      return 'Adicione suas receitas e despesas para acompanhar grÃ¡ficos detalhados e obter insights sobre suas finanÃ§as.'
    }
    if (balance < 0) {
      const topCat = categoryExpenses[0]
      return `Seus gastos ultrapassaram os ganhos em ${formatCurrency(Math.abs(balance))} neste mÃªs. Sua maior despesa foi em ${topCat ? topCat.label : 'categorias diversas'}.`
    }
    if (savingsRate >= 20) {
      return `Excelente! VocÃª estÃ¡ economizando ${savingsRate.toFixed(1)}% da sua renda neste mÃªs. Mantenha o foco para construir sua reserva!`
    }
    return `VocÃª economizou ${formatCurrency(balance)} (${savingsRate.toFixed(1)}% da renda). Tente poupar pelo menos 20% para alcanÃ§ar suas metas mais rÃ¡pido.`
  }, [totalIncome, totalExpense, balance, savingsRate, categoryExpenses])

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative bg-background min-h-screen pb-24">
      
      {/* Seletor de MÃªs */}
      <div className="bg-card rounded-2xl p-2 mb-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between px-2 py-1">
          <button 
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <h1 className="text-sm font-bold text-foreground">
            {MONTH_NAMES[month]} {year}
          </h1>
          <button 
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      </div>

      {/* Resumo Mensal */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 mb-4 shadow-sm border border-border/50"
      >
        <h2 className="font-bold text-sm text-foreground mb-4">Resumo Mensal do Cotidiano</h2>
        
        <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span className="text-[10px] font-medium">MÃ©dia diÃ¡ria</span>
            </div>
            <p className="font-bold text-foreground text-xs sm:text-sm">
              {formatCurrency(dailyAverage)}
            </p>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="text-[10px] font-medium">Taxa economia</span>
            </div>
            <p className={`font-bold text-xs sm:text-sm ${savingsRate >= 0 ? 'text-[#1db576]' : 'text-red-500'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              <span className="text-[10px] font-medium">Saldo do mÃªs</span>
            </div>
            <p className={`font-bold text-xs sm:text-sm ${balance >= 0 ? 'text-[#1db576]' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Dica Inteligente */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#e4fcf1] dark:bg-[#1a5b48]/20 rounded-2xl p-4 mb-4 flex items-center gap-3 border border-[#1a5b48]/10"
      >
        <div className="w-10 h-10 rounded-full bg-[#1a5b48] flex flex-shrink-0 items-center justify-center text-white shadow-sm">
          <span className="material-symbols-outlined text-xl">lightbulb</span>
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-[#1a5b48] dark:text-[#1db576] mb-0.5">Dica de GestÃ£o Financeira</h3>
          <p className="text-[10px] text-[#1a5b48]/90 dark:text-foreground/80 leading-snug font-medium">
            {tipText}
          </p>
        </div>
      </motion.div>

      {/* Despesas por Categoria + GrÃ¡ficos (isolados) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 mb-4 shadow-sm border border-border/50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm text-foreground">Despesas por Categoria</h2>
          <span className="text-[10px] text-muted-foreground font-medium">
            {categoryExpenses.length} {categoryExpenses.length === 1 ? 'categoria' : 'categorias'}
          </span>
        </div>
        
        {categoryExpenses.length === 0 ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-36 h-36 rounded-full border-[16px] border-muted/40 flex flex-col items-center justify-center text-center p-2">
              <span className="font-bold text-[11px] text-foreground">Sem gastos</span>
              <span className="text-[10px] text-muted-foreground font-medium">no perÃ­odo</span>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ChartsSection 
              categoryExpenses={categoryExpenses}
              sixMonthsHistory={sixMonthsHistory}
            />
          </div>
        )}
      </motion.div>

      {/* EvoluÃ§Ã£o Mensal (tambÃ©m dentro do ChartsSection) */}
      {categoryExpenses.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-sm text-foreground">EvoluÃ§Ã£o Mensal (6 Meses)</h2>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1db576]"></span>
                <span className="text-[10px] font-medium text-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#e74c4c]"></span>
                <span className="text-[10px] font-medium text-foreground">Despesas</span>
              </div>
            </div>
          </div>
          
          {/* O grÃ¡fico de barras tambÃ©m estÃ¡ no ChartsSection */}
          <div className="h-48 w-full">
            <ChartsSection 
              categoryExpenses={categoryExpenses}
              sixMonthsHistory={sixMonthsHistory}
              showOnlyBar
            />
          </div>
        </motion.div>
      )}
    </main>
  )
}

