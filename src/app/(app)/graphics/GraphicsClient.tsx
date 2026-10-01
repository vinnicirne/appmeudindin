'use client'

import { motion } from "framer-motion"
import { useState, useMemo } from 'react'

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
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string; hex: string }> = {
  alimentacao: { label: 'Alimentação', icon: 'restaurant', color: 'bg-orange-500', hex: '#f97316' },
  transporte: { label: 'Transporte', icon: 'directions_car', color: 'bg-blue-500', hex: '#3b82f6' },
  moradia: { label: 'Moradia', icon: 'home', color: 'bg-purple-500', hex: '#a855f7' },
  salario: { label: 'Salário', icon: 'payments', color: 'bg-green-500', hex: '#22c55e' },
  lazer: { label: 'Lazer', icon: 'sports_esports', color: 'bg-pink-500', hex: '#ec4899' },
  saude: { label: 'Saúde & Farmácia', icon: 'medical_services', color: 'bg-rose-500', hex: '#f43f5e' },
  educacao: { label: 'Educação', icon: 'school', color: 'bg-indigo-500', hex: '#6366f1' },
  servicos: { label: 'Serviços', icon: 'receipt_long', color: 'bg-teal-500', hex: '#14b8a6' },
  investimentos: { label: 'Investimentos', icon: 'trending_up', color: 'bg-emerald-500', hex: '#10b981' },
  outros: { label: 'Outros', icon: 'category', color: 'bg-gray-400', hex: '#9ca3af' },
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function GraphicsClient({ transactions }: { transactions: Transaction[] }) {
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

  // Transações do mês selecionado
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const parts = t.date.split('T')[0].split('-')
      if (parts.length >= 2) {
        const tYear = parseInt(parts[0], 10)
        const tMonth = parseInt(parts[1], 10) - 1
        return tYear === year && tMonth === month
      }
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
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

  // Média diária (dias no mês selecionado)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyAverage = totalExpense > 0 ? totalExpense / daysInMonth : 0

  // Taxa de economia
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  // Agrupamento por Categoria para Despesas
  const categoryExpenses = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'EXPENSE')
    const grouped: Record<string, number> = {}

    expenses.forEach(t => {
      const cat = (t.category_id || 'outros').toLowerCase()
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount || 0)
    })

    return Object.entries(grouped)
      .map(([catKey, amount]) => {
        const info = CATEGORY_MAP[catKey] || {
          label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
          icon: 'category',
          color: 'bg-gray-400',
          hex: '#9ca3af'
        }
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        return {
          key: catKey,
          label: info.label,
          icon: info.icon,
          color: info.color,
          hex: info.hex,
          amount,
          percentage
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [currentMonthTransactions, totalExpense])

  // Evolução Mensal dos últimos 6 meses
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
        const parts = t.date.split('T')[0].split('-')
        if (parts.length >= 2) {
          const tYear = parseInt(parts[0], 10)
          const tMonth = parseInt(parts[1], 10) - 1
          return tYear === targetYear && tMonth === targetMonth
        }
        const d = new Date(t.date)
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth
      })

      const inc = mTransactions.filter(t => t.type === 'INCOME').reduce((a, t) => a + Number(t.amount || 0), 0)
      const exp = mTransactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + Number(t.amount || 0), 0)

      months.push({
        label: MONTH_SHORT[targetMonth],
        income: inc,
        expense: exp,
        isCurrent: i === 0
      })
    }
    return months
  }, [transactions, year, month])

  const maxHistoryValue = useMemo(() => {
    const maxVal = Math.max(
      ...sixMonthsHistory.map(m => Math.max(m.income, m.expense)),
      1
    )
    return maxVal
  }, [sixMonthsHistory])

  // Dica Inteligente Dinâmica
  const tipText = useMemo(() => {
    if (totalIncome === 0 && totalExpense === 0) {
      return 'Adicione suas receitas e despesas para acompanhar gráficos detalhados e obter insights sobre suas finanças.'
    }
    if (balance < 0) {
      const topCat = categoryExpenses[0]
      return `Seus gastos ultrapassaram os ganhos em ${formatCurrency(Math.abs(balance))} neste mês. Sua maior despesa foi em ${topCat ? topCat.label : 'categorias diversas'}.`
    }
    if (savingsRate >= 20) {
      return `Excelente! Vocêê está economizando ${savingsRate.toFixed(1)}% da sua renda neste mês. Mantenha o foco para construir sua reserva!`
    }
    return `Vocêê economizou ${formatCurrency(balance)} (${savingsRate.toFixed(1)}% da renda). Tente poupar pelo menos 20% para alcançar suas metas mais rápido.`
  }, [totalIncome, totalExpense, balance, savingsRate, categoryExpenses])

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative bg-background min-h-screen pb-24">
      
      {/* Month Selector */}
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

      {/* Resumo Mensal do Cotidiano */}
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
              <span className="text-[10px] font-medium">Média diária</span>
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
              <span className="text-[10px] font-medium">Saldo do mês</span>
            </div>
            <p className={`font-bold text-xs sm:text-sm ${balance >= 0 ? 'text-[#1db576]' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Banner de Dica Inteligente */}
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
          <h3 className="text-[11px] font-bold text-[#1a5b48] dark:text-[#1db576] mb-0.5">Dica de Gestão Financeira</h3>
          <p className="text-[10px] text-[#1a5b48]/90 dark:text-foreground/80 leading-snug font-medium">
            {tipText}
          </p>
        </div>
      </motion.div>

      {/* Despesas por Categoria */}
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
              <span className="text-[10px] text-muted-foreground font-medium">no período</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barra de Progresso Multi-Categorias */}
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
              {categoryExpenses.map(cat => (
                <div 
                  key={cat.key}
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.hex }}
                  className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                  title={`${cat.label}: ${cat.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Lista detalhada das categorias */}
            <div className="space-y-2.5 pt-2">
              {categoryExpenses.map(cat => (
                <div key={cat.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      style={{ backgroundColor: cat.hex }} 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                    />
                    <span className="font-medium text-foreground">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-bold text-foreground">{formatCurrency(cat.amount)}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold w-10 text-right">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Evolução Mensal (Últimos 6 Meses) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-sm text-foreground">Evolução Mensal (6 Meses)</h2>
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
        
        {/* Gráfico de Barras Responsivo */}
        <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 border-b border-border/40">
          {sixMonthsHistory.map((m, idx) => {
            const incHeight = maxHistoryValue > 0 ? (m.income / maxHistoryValue) * 100 : 0
            const expHeight = maxHistoryValue > 0 ? (m.expense / maxHistoryValue) * 100 : 0

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  {/* Barra Receita */}
                  <div className="w-2.5 sm:w-3 bg-muted/40 rounded-t-sm h-full flex items-end">
                    <div 
                      style={{ height: `${Math.max(incHeight, m.income > 0 ? 6 : 0)}%` }}
                      className="w-full bg-[#1db576] rounded-t-sm transition-all duration-500"
                      title={`Receitas em ${m.label}: ${formatCurrency(m.income)}`}
                    />
                  </div>
                  {/* Barra Despesa */}
                  <div className="w-2.5 sm:w-3 bg-muted/40 rounded-t-sm h-full flex items-end">
                    <div 
                      style={{ height: `${Math.max(expHeight, m.expense > 0 ? 6 : 0)}%` }}
                      className="w-full bg-[#e74c4c] rounded-t-sm transition-all duration-500"
                      title={`Despesas em ${m.label}: ${formatCurrency(m.expense)}`}
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${m.isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

    </main>
  );
}
