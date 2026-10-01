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

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  alimentacao: { label: 'Alimentação', icon: 'restaurant', color: 'bg-orange-100 text-orange-500' },
  transporte: { label: 'Transporte', icon: 'directions_car', color: 'bg-blue-100 text-blue-500' },
  moradia: { label: 'Moradia', icon: 'home', color: 'bg-purple-100 text-purple-500' },
  salario: { label: 'Salário', icon: 'payments', color: 'bg-green-100 text-green-500' },
  lazer: { label: 'Lazer', icon: 'sports_esports', color: 'bg-pink-100 text-pink-500' },
  saude: { label: 'Saúde & Farmácia', icon: 'medical_services', color: 'bg-rose-100 text-rose-500' },
  educacao: { label: 'Educação', icon: 'school', color: 'bg-indigo-100 text-indigo-500' },
  servicos: { label: 'Serviços', icon: 'receipt_long', color: 'bg-teal-100 text-teal-500' },
  investimentos: { label: 'Investimentos', icon: 'trending_up', color: 'bg-emerald-100 text-emerald-500' },
  outros: { label: 'Outros', icon: 'category', color: 'bg-gray-100 text-gray-500' },
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PlanningClient({ transactions }: { transactions: Transaction[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeFilter, setActiveFilter] = useState('Todas')

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

  const expensesByCategory = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'EXPENSE')
    const grouped: Record<string, number> = {}

    // Initialize all basic categories with 0 so they show up
    Object.keys(CATEGORY_MAP).forEach(k => {
      if (k !== 'salario') grouped[k] = 0
    })

    expenses.forEach(t => {
      const cat = (t.category_id || 'outros').toLowerCase()
      if (cat !== 'salario') {
        grouped[cat] = (grouped[cat] || 0) + Number(t.amount || 0)
      }
    })

    return Object.entries(grouped)
      .map(([catKey, amount]) => {
        const info = CATEGORY_MAP[catKey] || {
          label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
          icon: 'category',
          color: 'bg-gray-100 text-gray-500',
        }
        return {
          key: catKey,
          label: info.label,
          icon: info.icon,
          color: info.color,
          amount,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [currentMonthTransactions])

  const totalSpent = expensesByCategory.reduce((acc, cat) => acc + cat.amount, 0)
  
  // Future: fetch real goals from Supabase
  const totalGoal = 0
  
  const filters = [`Todas (${expensesByCategory.length})`, `Com Metas (0)`, `Sem Metas (${expensesByCategory.length})`]

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

      {/* Orçamento Global Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-4 mb-4 shadow-sm border border-border/50"
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-sm text-foreground">Orçamento Global do Mês</h2>
          <span className="bg-[#e4fcf1] text-[#1db576] px-2 py-1 rounded text-[10px] font-bold">Sem metas</span>
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Gasto em categorias orçadas</p>
            <p className="text-xl font-extrabold text-foreground">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-medium">Limite global planejado</p>
            <p className="text-sm font-bold text-[#1db576]">{formatCurrency(totalGoal)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-muted rounded-full mb-3">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1db576]"></div>
        </div>

        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-foreground/70">Defina limites abaixo para acompanhar</span>
          <span className="text-foreground/70">0 categorias ativas</span>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => {
          const baseName = filter.split(' (')[0]
          return (
            <button 
              key={filter}
              onClick={() => setActiveFilter(baseName)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === baseName 
                  ? 'bg-[#e4fcf1] text-[#1a5b48] border border-transparent' 
                  : 'bg-transparent text-foreground/80 border border-border hover:bg-muted'
              }`}
            >
              {filter}
            </button>
          )
        })}
      </div>

      {/* Section Title */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-bold text-sm text-foreground">Progresso por Categoria</h3>
        <span className="text-[10px] text-muted-foreground font-medium">Toque no lápis para alterar</span>
      </div>

      {/* Category Cards */}
      <div className="flex flex-col gap-3">
        {expensesByCategory.map((cat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            key={cat.key} 
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}>
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{cat.label}</h4>
                  <p className="text-xs text-muted-foreground">Sem meta definida</p>
                </div>
              </div>
              <button 
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-[#1a5b48]"
                onClick={() => alert('Definição de metas em breve!')}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-foreground">Total gasto: {formatCurrency(cat.amount)}</span>
              <span className="text-[10px] font-bold text-[#1db576]">Toque no lápis para criar meta</span>
            </div>
          </motion.div>
        ))}
      </div>

    </main>
  );
}
