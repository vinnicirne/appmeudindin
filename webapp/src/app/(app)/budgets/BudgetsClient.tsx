'use client'

import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo } from 'react'
import { saveBudgetAction } from '@/app/actions/budgetActions'
import { toast } from 'react-hot-toast'

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

export default function BudgetsClient({ transactions, budgets: initialBudgets, dbCategories = [] }: { transactions: Transaction[], budgets: Budget[], dbCategories?: any[] }) {
  
  // Mapa real do banco de dados (Dashboard) - Sem mocks ou merges híbridos
  const mergedCategories: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {}
    dbCategories.forEach(c => {
      const colorClass = c.color || 'bg-gray-500'
      // O Dashboard já fornece a cor base em background (ex: bg-blue-500). 
      // Repassamos a classe bruta e adicionamos text-white para contraste do ícone.
      map[c.slug || c.id] = { 
        label: c.name || c.title || c.slug, 
        icon: c.icon || 'category', 
        color: `${colorClass} text-white shadow-sm` 
      }
    })
    return map
  }, [dbCategories])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets || [])

  // Estado do Modal
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

    Object.keys(mergedCategories).forEach(k => {
      grouped[k] = 0
    })

    expenses.forEach(t => {
      const cat = t.category_id || 'outros'
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount || 0)
    })

    return Object.entries(grouped).map(([catKey, amount]) => {
      const info = mergedCategories[catKey] || {
        label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        icon: 'category',
        color: 'bg-gray-100 text-gray-500',
      }
      const budgetObj = budgets.find(b => b.category_id === catKey)
      const goalAmount = budgetObj ? Number(budgetObj.amount) : 0
      const hasGoal = goalAmount > 0
      
      let percentage = 0
      if (hasGoal) {
        percentage = Math.min((amount / goalAmount) * 100, 100)
      }

      return {
        key: catKey,
        label: info.label,
        icon: info.icon,
        color: info.color,
        amount,
        goalAmount,
        hasGoal,
        percentage
      }
    })
  }, [currentMonthTransactions, budgets])

  // Filtragem
  const filteredCategories = useMemo(() => {
    let sorted = [...expensesByCategory].sort((a, b) => b.amount - a.amount)
    if (activeFilter === 'Com Metas') {
      return sorted.filter(c => c.hasGoal)
    } else if (activeFilter === 'Sem Metas') {
      return sorted.filter(c => !c.hasGoal)
    }
    return sorted
  }, [expensesByCategory, activeFilter])

  // Resumo Global
  const totalGoal = budgets.reduce((acc, b) => acc + Number(b.amount), 0)
  const totalSpentInGoals = expensesByCategory
    .filter(c => c.hasGoal)
    .reduce((acc, c) => acc + c.amount, 0)
  
  const globalPercentage = totalGoal > 0 ? Math.min((totalSpentInGoals / totalGoal) * 100, 100) : 0
  const activeGoalsCount = budgets.filter(b => b.amount > 0).length

  const filters = [
    `Todas (${expensesByCategory.length})`, 
    `Com Metas (${expensesByCategory.filter(c => c.hasGoal).length})`, 
    `Sem Metas (${expensesByCategory.filter(c => !c.hasGoal).length})`
  ]

  const handleOpenEdit = (catKey: string, currentGoal: number) => {
    setEditingCategory(catKey)
    setBudgetInput(currentGoal > 0 ? currentGoal.toString() : '')
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setIsSaving(true)
    const rawVal = budgetInput.replace(/\./g, '').replace(',', '.')
    const parsedAmount = parseFloat(rawVal) || 0

    const res = await saveBudgetAction(editingCategory, parsedAmount)
    setIsSaving(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Meta atualizada com sucesso!')
      
      // Atualiza estado local otimista
      setBudgets(prev => {
        const filtered = prev.filter(b => b.category_id !== editingCategory)
        if (parsedAmount > 0) {
          filtered.push({ id: 'temp-' + Date.now(), category_id: editingCategory, amount: parsedAmount })
        }
        return filtered
      })
      setEditingCategory(null)
    }
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, '')
    if (!value) { setBudgetInput(''); return }
    const numberValue = parseInt(value, 10) / 100
    setBudgetInput(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative bg-background min-h-screen pb-24">
      
      {/* Month Selector */}
      <div className="bg-card rounded-2xl p-2 mb-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between px-2 py-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full">
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <h1 className="text-sm font-bold text-foreground">
            {MONTH_NAMES[month]} {year}
          </h1>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      </div>

      {/* Orçamento Global Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-4 mb-4 shadow-sm border border-border/50">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-sm text-foreground">Orçamento Global Mensal</h2>
          <span className={`px-2 py-1 rounded text-[10px] font-bold ${activeGoalsCount > 0 ? 'bg-[#e4fcf1] text-[#1db576]' : 'bg-muted text-muted-foreground'}`}>
            {activeGoalsCount > 0 ? `${activeGoalsCount} metas ativas` : 'Sem metas globais'}
          </span>
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Gasto em categorias com meta</p>
            <p className="text-xl font-extrabold text-foreground">{formatCurrency(totalSpentInGoals)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-medium">Limite global planejado</p>
            <p className="text-sm font-bold text-[#1db576]">{formatCurrency(totalGoal)}</p>
          </div>
        </div>

        <div className="relative h-2 bg-muted rounded-full mb-3 overflow-hidden">
          <div 
            style={{ width: `${globalPercentage}%` }} 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${globalPercentage > 90 ? 'bg-red-500' : 'bg-[#1db576]'}`}
          />
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

      {/* Category Cards */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filteredCategories.map((cat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={cat.key} 
              className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}>
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{cat.label}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.hasGoal ? `Meta: ${formatCurrency(cat.goalAmount)}` : 'Sem meta definida'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(cat.key, cat.goalAmount)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-[#1a5b48] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
              
              {cat.hasGoal ? (
                <>
                  <div className="relative h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                    <div 
                      style={{ width: `${cat.percentage}%` }} 
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${cat.percentage >= 100 ? 'bg-red-500' : cat.percentage > 80 ? 'bg-orange-500' : 'bg-[#1db576]'}`}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-foreground">Gasto: {formatCurrency(cat.amount)}</span>
                    <span className={`text-[10px] font-bold ${cat.percentage >= 100 ? 'text-red-500' : 'text-[#1db576]'}`}>
                      {cat.percentage.toFixed(1)}% do limite
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold text-foreground">Total gasto: {formatCurrency(cat.amount)}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Toque no lápis para criar</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal de Editar Meta */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingCategory(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-foreground">Definir Teto de Gastos</h2>
                <button onClick={() => setEditingCategory(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="mb-6 flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mergedCategories[editingCategory]?.color || 'bg-gray-100 text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[18px]">{mergedCategories[editingCategory]?.icon || 'category'}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Categoria</p>
                  <p className="font-bold text-foreground">{mergedCategories[editingCategory]?.label}</p>
                </div>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Valor Limite por Mês
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={budgetInput}
                      onChange={handleCurrencyChange}
                      placeholder="0,00"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">Deixe vazio ou R$ 0,00 para remover a meta.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setEditingCategory(null)} className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center">
                    {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Salvar Teto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
