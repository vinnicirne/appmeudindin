'use client'

import { motion } from "framer-motion"
import { useState, useMemo, useDeferredValue } from "react"
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { deleteTransactionAction, togglePaidTransactionAction } from '@/app/actions/transactionActions'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useQueryClient } from '@tanstack/react-query'
import { parseDateParts, formatDateBR, dateKey } from '@/lib/dateUtils'
import { buildCategoryMap, buildCategoryColorsMap } from '@/lib/categoryUtils'

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

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TransactionsClient() {
  const { data, isLoading } = useDashboardData()
  const transactions = data?.transactions || []
  const dbCategories = data?.categories || []

  const queryClient = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [activeType, setActiveType] = useState('Todas')
  const [activeCategory, setActiveCategory] = useState('todas')
  
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const categoryMap = useMemo(() => buildCategoryMap(dbCategories), [dbCategories])
  const categoryColorsMap = useMemo(() => buildCategoryColorsMap(dbCategories), [dbCategories])

  const { filtered, totalIncome, totalExpense, liquid } = useMemo(() => {
    const list = transactions
      .filter(t => {
        const parts = parseDateParts(t.date)
        if (!parts || parts.year !== year || parts.month !== month) return false

        if (activeType === 'Receitas' && t.type !== 'INCOME') return false
        if (activeType === 'Despesas' && t.type !== 'EXPENSE') return false
        if (activeType === 'Liquidados' && t.is_paid !== true) return false
        if (activeType === 'Pendentes' && t.is_paid === true) return false
        if (activeCategory !== 'todas' && t.category_id !== activeCategory) return false
        
        if (deferredSearch) {
          const q = deferredSearch.toLowerCase()
          if (!t.description.toLowerCase().includes(q)) return false
        }
        return true
      })
      .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))

    let income = 0
    let expense = 0
    for (const t of list) {
      if (t.type === 'INCOME') income += Number(t.amount || 0)
      else expense += Number(t.amount || 0)
    }

    return {
      filtered: list,
      totalIncome: income,
      totalExpense: expense,
      liquid: income - expense,
    }
  }, [transactions, year, month, activeType, activeCategory, deferredSearch])

  const categories = useMemo(() => {
    const seen = new Set(transactions.filter(t => {
      const p = parseDateParts(t.date); 
      return p && p.year === year && p.month === month
    }).map(t => t.category_id))
    return ['todas', ...Array.from(seen)]
  }, [transactions, year, month])

  const types = ['Todas', 'Receitas', 'Despesas', 'Liquidados', 'Pendentes']

  async function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    setTransactionToDelete(id)
  }

  async function confirmDelete() {
    if (!transactionToDelete) return
    const id = transactionToDelete
    setTransactionToDelete(null)
    setDeletingId(id)
    
    const res = await deleteTransactionAction(id)
    setDeletingId(null)
    
    if (res?.error) {
      toast.error('Erro ao excluir: ' + res.error)
    } else {
      toast.success('Lançamento excluído!')
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  async function handleTogglePaid(t: Transaction, e?: React.MouseEvent) {
    e?.stopPropagation()
    const newStatus = !(t.is_paid === true)
    
    queryClient.setQueryData(['dashboardData'], (old: any) => {
      if (!old?.transactions) return old
      return {
        ...old,
        transactions: old.transactions.map((tx: Transaction) =>
          tx.id === t.id ? { ...tx, is_paid: newStatus } : tx
        ),
      }
    })

    const res = await togglePaidTransactionAction(t.id, newStatus)
    if (res?.error) {
      toast.error('Erro ao alterar status: ' + res.error)
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    } else {
      toast.success(newStatus ? (t.type === 'INCOME' ? 'Marcado como recebido!' : 'Marcado como pago!') : 'Marcado como pendente!')
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  function handleToggleSelection(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleExportCSV() {
    if (filtered.length === 0) {
      toast.error('Nenhum dado para exportar neste mês.')
      return
    }

    const headers = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor', 'Status']
    const rows = filtered.map(t => {
      const data = formatDateBR(t.date)
      const desc = `"${t.description.replace(/"/g, '""')}"`
      const cat = categoryMap[t.category_id] || t.category_id
      const type = t.type === 'INCOME' ? 'Receita' : 'Despesa'
      const val = t.amount.toString().replace('.', ',')
      const status = t.is_paid === true ? 'Pago/Recebido' : 'Pendente'
      return [data, desc, cat, type, val, status].join(';')
    })

    const csvContent = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `extrato_${MONTH_NAMES[month]}_${year}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Arquivo CSV gerado com sucesso!')
  }

  function handleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(t => t.id))
    }
  }

  async function handleBulkToggle(markAsPaid: boolean) {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)
    const ids = [...selectedIds]
    
    const results = await Promise.all(ids.map(id => togglePaidTransactionAction(id, markAsPaid)))
    const errors = results.filter(r => r?.error)

    setIsBulkProcessing(false)
    setSelectedIds([])
    setIsSelecting(false)
    
    if (errors.length > 0) {
      toast.error(`${errors.length} alteração(ões) falharam`)
    } else {
      toast.success(markAsPaid ? 'Transações marcadas como baixadas!' : 'Transações marcadas como pendentes!')
    }
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)
    const ids = [...selectedIds]

    const results = await Promise.all(ids.map(id => deleteTransactionAction(id)))
    const errors = results.filter(r => r?.error)

    setIsBulkProcessing(false)
    setSelectedIds([])
    setIsSelecting(false)
    setBulkDeleteConfirm(false)

    if (errors.length > 0) {
      toast.error(`${errors.length} exclusão(ões) falharam`)
    } else {
      toast.success(`${ids.length} lançamento(s) excluído(s)!`)
    }
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">

      <div className="bg-card rounded-2xl p-2 mb-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between px-2 py-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <h1 className="text-sm font-bold text-foreground">{MONTH_NAMES[month]} {year}</h1>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">search</span>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        {!isSelecting && (
          <button
            onClick={handleExportCSV}
            title="Exportar para Excel (CSV)"
            className="flex items-center justify-center w-12 h-[46px] rounded-xl border border-border bg-card text-foreground shadow-sm hover:bg-muted transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-lg">download</span>
          </button>
        )}
      </div>

      {isSelecting && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-3 mb-4 flex flex-col gap-3 shadow-sm border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{selectedIds.length} selecionados</span>
            <button onClick={() => setIsSelecting(false)} className="text-sm text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
          </div>
          
          <div className="flex items-center justify-between border-t border-border pt-3">
            <button onClick={handleSelectAll} className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
              {selectedIds.length === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkToggle(true)}
                disabled={selectedIds.length === 0 || isBulkProcessing}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-[#1db576] hover:text-white rounded-lg transition-colors disabled:opacity-50"
                title="Marcar como recebido/pago"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </button>
              <button 
                onClick={() => handleBulkToggle(false)}
                disabled={selectedIds.length === 0 || isBulkProcessing}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-amber-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                title="Marcar como pendente"
              >
                <span className="material-symbols-outlined text-sm">schedule</span>
              </button>
              <button 
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={selectedIds.length === 0 || isBulkProcessing}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-[#e74c4c] hover:text-white rounded-lg transition-colors disabled:opacity-50"
                title="Excluir"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeType === type 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-muted-foreground border border-border/50 hover:bg-muted'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-border/50">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === cat 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-card text-muted-foreground border border-border/50 hover:bg-muted'
              }`}
            >
              {cat !== 'todas' && (
                <span className={`w-2 h-2 rounded-full ${categoryColorsMap[cat] || 'bg-gray-400'}`}></span>
              )}
              {cat === 'todas' ? 'Todas Categorias' : (categoryMap[cat] || cat)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span> Entradas
          </p>
          <p className="text-sm font-bold text-[#1db576]">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span> Saídas
          </p>
          <p className="text-sm font-bold text-[#e74c4c]">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">account_balance_wallet</span> Saldo Líquido
          </p>
          <p className={`text-sm font-bold ${liquid >= 0 ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
            {formatCurrency(liquid)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-sm font-bold text-foreground">
          {filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}
        </h2>
        <button 
          onClick={() => setIsSelecting(!isSelecting)}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${isSelecting ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary/10'}`}
        >
          {isSelecting ? 'Concluído' : 'Selecionar'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((t) => {
            const isPaid = t.is_paid === true
            const isIncome = t.type === 'INCOME'
            const catLabel = categoryMap[t.category_id] || t.category_id
            const catColor = categoryColorsMap[t.category_id] || 'bg-gray-400'
            const isSelected = selectedIds.includes(t.id)

            return (
              <div
                key={t.id}
                onClick={() => isSelecting ? handleToggleSelection(t.id) : setEditingTransaction(t as any)}
                className={`relative bg-card rounded-2xl shadow-sm border overflow-hidden transition-all ${
                  isSelecting 
                    ? isSelected 
                      ? 'border-primary cursor-pointer' 
                      : 'border-border/50 cursor-pointer hover:border-primary/50'
                    : 'border-border/50 cursor-pointer hover:border-border'
                }`}
              >
                <div className="p-4 flex items-center gap-4 bg-card relative z-10">
                  {isSelecting && (
                    <div className="flex-shrink-0 mr-1">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                        {isSelected && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                      </div>
                    </div>
                  )}
                  
                  <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-white ${catColor}`}>
                    <span className="material-symbols-outlined text-lg">
                      {isIncome ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm text-foreground truncate ${!isPaid && 'opacity-60'}`}>
                      {t.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {catLabel} • {formatDateBR(t.date)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className={`font-bold text-sm ${!isPaid ? 'text-muted-foreground' : (isIncome ? 'text-[#1db576]' : 'text-foreground')}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    
                    {!isSelecting && (
                      <button
                        onClick={(e) => handleTogglePaid(t as any, e)}
                        disabled={deletingId === t.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                          isPaid 
                            ? 'bg-[#1db576]/10 text-[#1db576] border-[#1db576]/20' 
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                      >
                        {isPaid ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <ConfirmModal
        isOpen={!!transactionToDelete}
        title="Excluir lançamento"
        description="Tem certeza? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        title="Excluir em massa"
        description={`Tem certeza que deseja excluir ${selectedIds.length} lançamento(s)? Esta ação não pode ser desfeita.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction as any}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['dashboardData'] })}
        />
      )}
    </main>
  )
}
