'use client'

import { motion } from "framer-motion"
import { useState, useMemo } from 'react'
import { saveBudgetAction } from '@/app/actions/budgetActions'
import { toast } from 'react-hot-toast'

interface Transaction {
  id: string
  amount: number
  date: string
  type: 'INCOME' | 'EXPENSE'
  category_id: string
}

interface Budget {
  id: string
  category_id: string
  amount: number
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BudgetsClient({ 
  transactions, 
  budgets: initialBudgets, 
  dbCategories = [] 
}: { 
  transactions: Transaction[]
  budgets: Budget[]
  dbCategories?: any[] 
}) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeFilter, setActiveFilter] = useState('Todas')

  // Edit State
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Memo robusto e único para categories
  const categoryInfoMap = useMemo(() => {
    const map: Record<string, { label: string; icon: string; color: string }> = {}
    for (const c of dbCategories) {
      const colorClass = c.color || 'bg-gray-500'
      const info = {
        label: c.label || c.name || c.title || c.slug || 'Categoria',
        icon: c.icon || 'category',
        color: `${colorClass} text-white shadow-sm`,
      }
      if (c.id) map[c.id] = info
      if (c.slug) map[c.slug] = info
    }
    return map
  }, [dbCategories])

  const budgetByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of budgets) {
      map[b.category_id] = Number(b.amount) || 0
    }
    return map
  }, [budgets])

  const {
    expensesByCategory,
    totalGoal,
    totalSpentInGoals,
    globalPercentage,
    activeGoalsCount,
  } = useMemo(() => {
    const spent: Record<string, number> = {}

    for (const key of Object.keys(categoryInfoMap)) {
      spent[key] = 0
    }

    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue
      const parts = (t.date || '').split('T')[0].split('-')
      if (parts.length < 2) continue
      const tYear = parseInt(parts[0], 10)
      const tMonth = parseInt(parts[1], 10) - 1
      if (tYear !== year || tMonth !== month) continue

      const cat = t.category_id || 'outros'
      spent[cat] = (spent[cat] || 0) + (Number(t.amount) || 0)
    }

    for (const catId of Object.keys(budgetByCategory)) {
      if (spent[catId] === undefined) spent[catId] = 0
    }

    const list = Object.entries(spent).map(([catKey, amount]) => {
      const info = categoryInfoMap[catKey] || {
        label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        icon: 'category',
        color: 'bg-gray-100 text-gray-500',
      }
      const goalAmount = budgetByCategory[catKey] || 0
      const hasGoal = goalAmount > 0
      const percentage = hasGoal ? Math.min((amount / goalAmount) * 100, 100) : 0

      return {
        key: catKey,
        label: info.label,
        icon: info.icon,
        color: info.color,
        amount,
        goalAmount,
        hasGoal,
        percentage,
      }
    }).sort((a, b) => b.amount - a.amount)

    const goalSum = Object.values(budgetByCategory).reduce((a, v) => a + v, 0)
    const spentInGoals = list.filter(c => c.hasGoal).reduce((a, c) => a + c.amount, 0)
    const pct = goalSum > 0 ? Math.min((spentInGoals / goalSum) * 100, 100) : 0
    const goalsCount = Object.values(budgetByCategory).filter(v => v > 0).length

    return {
      expensesByCategory: list,
      totalGoal: goalSum,
      totalSpentInGoals: spentInGoals,
      globalPercentage: pct,
      activeGoalsCount: goalsCount,
    }
  }, [transactions, year, month, categoryInfoMap, budgetByCategory])

  const filterOptions = useMemo(() => [
    { id: 'Todas', label: `Todas (${expensesByCategory.filter(c => c.amount > 0 || c.hasGoal).length})` },
    { id: 'Com Metas', label: `Com Metas (${expensesByCategory.filter(c => c.hasGoal).length})` },
    { id: 'Sem Metas', label: `Sem Metas (${expensesByCategory.filter(c => !c.hasGoal && c.amount > 0).length})` },
  ], [expensesByCategory])

  const displayList = useMemo(() => {
    return expensesByCategory.filter(c => {
      if (activeFilter === 'Com Metas') return c.hasGoal
      if (activeFilter === 'Sem Metas') return !c.hasGoal && c.amount > 0
      return c.amount > 0 || c.hasGoal // Esconde categorias sem gasto e sem meta no "Todas"
    })
  }, [expensesByCategory, activeFilter])

  function handleEditClick(catKey: string, currentGoal: number) {
    setEditingCategory(catKey)
    setBudgetInput(currentGoal > 0 ? currentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '')
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, '')
    if (value === '') { setBudgetInput(''); return }
    const numberValue = parseInt(value, 10) / 100
    setBudgetInput(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setIsSaving(true)
    const normalized = budgetInput.replace(/\./g, '').replace(',', '.')
    const parsedAmount = Math.max(0, parseFloat(normalized) || 0)

    const res = await saveBudgetAction(editingCategory, parsedAmount)
    setIsSaving(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success(parsedAmount > 0 ? 'Meta atualizada!' : 'Meta removida!')

    setBudgets(prev => {
      const next = prev.filter(b => b.category_id !== editingCategory)
      if (parsedAmount > 0) {
        next.push({
          id: res?.data?.id ?? `temp-${editingCategory}`,
          category_id: editingCategory,
          amount: parsedAmount,
        })
      }
      return next
    })
    setEditingCategory(null)
  }

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">
      
      <div className="bg-card rounded-2xl p-2 mb-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between px-2 py-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-bold text-foreground">{MONTH_NAMES[month]} {year}</h1>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Orçamento</span>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 mb-6"
      >
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Desempenho Geral (Metas)
            </p>
            <div className="flex items-baseline gap-1">
              <h2 className="text-xl font-bold text-foreground">{formatCurrency(totalSpentInGoals)}</h2>
              <span className="text-xs text-muted-foreground font-medium">/ {formatCurrency(totalGoal)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-bold ${globalPercentage > 100 ? 'text-[#e74c4c]' : 'text-[#1db576]'}`}>
              {globalPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/20">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(globalPercentage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${globalPercentage > 100 ? 'bg-[#e74c4c]' : 'bg-[#1db576]'}`}
          />
        </div>
        
        <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
          {activeGoalsCount} {activeGoalsCount === 1 ? 'meta ativa' : 'metas ativas'} recorrentes por mês.
        </p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {filterOptions.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === f.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-muted-foreground border border-border/50 hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {displayList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl bg-card">
            Nenhuma categoria encontrada
          </div>
        ) : (
          displayList.map(cat => {
            const isOver = cat.amount > cat.goalAmount
            
            return (
              <motion.div 
                key={cat.key}
                layout
                className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${cat.color}`}>
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{cat.label}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {cat.hasGoal ? `${formatCurrency(cat.amount)} de ${formatCurrency(cat.goalAmount)}` : 'Sem meta definida'}
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1">
                    {cat.hasGoal && (
                      <span className={`text-xs font-bold ${isOver ? 'text-[#e74c4c]' : 'text-[#1db576]'}`}>
                        {cat.percentage.toFixed(1)}%
                      </span>
                    )}
                    <button 
                      onClick={() => handleEditClick(cat.key, cat.goalAmount)}
                      className="text-[10px] text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded-md"
                    >
                      {cat.hasGoal ? 'Ajustar Meta' : 'Criar Meta'}
                    </button>
                  </div>
                </div>

                {cat.hasGoal && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${isOver ? 'bg-[#e74c4c]' : 'bg-[#1db576]'}`}
                    />
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {editingCategory && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border/50 p-5"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground">Definir Meta Mensal</h3>
              <button onClick={() => setEditingCategory(null)} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              Esta meta será fixa e aplicada a todos os meses recorrentemente.
            </p>

            <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Valor (R$)</label>
                <input 
                  type="text"
                  value={budgetInput}
                  onChange={handleCurrencyChange}
                  placeholder="0,00"
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 text-right font-medium"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70"
                >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                  ) : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  )
}
