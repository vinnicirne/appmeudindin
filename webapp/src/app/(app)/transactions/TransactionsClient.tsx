'use client'

import * as motion from "framer-motion/client"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { deleteTransactionAction, togglePaidTransactionAction } from '@/app/actions/transactionActions'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'

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

const categoryLabel: Record<string, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  salario: 'Salário',
  lazer: 'Lazer',
  saude: 'Saúde & Farmácia',
  outros: 'Outros',
}

const CATEGORY_COLORS: Record<string, string> = {
  alimentacao: 'bg-orange-500',
  transporte: 'bg-blue-500',
  moradia: 'bg-purple-500',
  salario: 'bg-green-500',
  lazer: 'bg-pink-500',
  saude: 'bg-rose-500',
  outros: 'bg-gray-400',
}

export default function TransactionsClient({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeType, setActiveType] = useState('Todas')
  const [activeCategory, setActiveCategory] = useState('todas')
  const [search, setSearch] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  
  // Bulk Actions
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const byMonth = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    }), [transactions, year, month])

  const filtered = useMemo(() => {
    return byMonth.filter(t => {
      if (activeType === 'Receitas' && t.type !== 'INCOME') return false
      if (activeType === 'Despesas' && t.type !== 'EXPENSE') return false
      if (activeType === 'Liquidados' && t.is_paid === false) return false
      if (activeType === 'Pendentes' && t.is_paid !== false) return false
      if (activeCategory !== 'todas' && t.category_id !== activeCategory) return false
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [byMonth, activeType, activeCategory, search])

  const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const liquid = totalIncome - totalExpense

  const categories = useMemo(() => {
    const seen = new Set(byMonth.map(t => t.category_id))
    return ['todas', ...Array.from(seen)]
  }, [byMonth])

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
      router.refresh()
    }
  }

  async function handleTogglePaid(t: Transaction, e?: React.MouseEvent) {
    e?.stopPropagation()
    const newStatus = t.is_paid === false ? true : false
    const res = await togglePaidTransactionAction(t.id, newStatus)
    if (res?.error) {
      toast.error('Erro ao alterar status: ' + res.error)
    } else {
      toast.success(newStatus ? (t.type === 'INCOME' ? 'Marcado como recebido!' : 'Marcado como pago!') : 'Marcado como pendente!')
      router.refresh()
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
      const data = new Date(t.date).toLocaleDateString('pt-BR')
      const desc = `"${t.description.replace(/"/g, '""')}"`
      const cat = categoryLabel[t.category_id] || t.category_id
      const type = t.type === 'INCOME' ? 'Receita' : 'Despesa'
      const val = t.amount.toString().replace('.', ',')
      const status = t.is_paid ? 'Pago/Recebido' : 'Pendente'
      return [data, desc, cat, type, val, status].join(';')
    })

    const csvContent = [headers.join(';'), ...rows].join('\n')
    // Adiciona o BOM do UTF-8 para o Excel abrir com acentuação correta
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
    const ids = [...selectedIds]
    setSelectedIds([])
    setIsSelecting(false)
    
    // Processa de forma simplificada chamando a action
    const promises = ids.map(id => togglePaidTransactionAction(id, markAsPaid))
    await Promise.all(promises)
    
    toast.success(markAsPaid ? 'Transações marcadas como baixadas!' : 'Transações marcadas como pendentes!')
    router.refresh()
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    setIsBulkDeleting(true)
    const promises = selectedIds.map(id => deleteTransactionAction(id))
    await Promise.all(promises)
    setIsBulkDeleting(false)
    setSelectedIds([])
    setIsSelecting(false)
    toast.success('Transações excluídas!')
    router.refresh()
  }

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">

      {/* Month Selector */}
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

      {/* Search & Actions Header */}
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
        <button
          onClick={() => { setIsSelecting(!isSelecting); setSelectedIds([]); }}
          className={`flex items-center gap-2 px-4 rounded-xl border text-sm font-bold transition-colors ${isSelecting ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border shadow-sm hover:bg-muted'}`}
        >
          <span className="material-symbols-outlined text-lg">{isSelecting ? 'close' : 'checklist'}</span>
          <span className="hidden sm:inline">{isSelecting ? 'Cancelar' : 'Selecionar'}</span>
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeType === type
                ? 'bg-primary/10 text-primary border border-transparent font-bold'
                : 'bg-transparent text-foreground/80 border border-border hover:bg-muted'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeCategory === cat
                ? 'bg-primary/10 text-primary border border-transparent font-bold'
                : 'bg-transparent text-foreground/80 border border-transparent hover:bg-muted'
            }`}
          >
            {cat !== 'todas' && <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-400'}`} />}
            {cat === 'todas' ? 'Todas Categorias' : (categoryLabel[cat] || cat)}
          </button>
        ))}
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-[10px] text-muted-foreground font-medium">{filtered.length} registro(s)</span>
        <span className={`text-[10px] font-bold ${liquid >= 0 ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
          Líquido: {formatCurrency(liquid)}
        </span>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon="filter_list" 
          title="Nenhuma transação encontrada" 
          description="Tente alterar os filtros ou o mês selecionado" 
          className="my-10" 
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => {
            const isPaid = t.is_paid !== false
            return (
              <div key={t.id} className="relative rounded-2xl bg-gradient-to-r from-emerald-500/20 to-rose-500/20 overflow-hidden mb-1">
                {/* Background (Ações visuais embaixo do card) */}
                <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <span className="material-symbols-outlined">check_circle</span>
                    {isPaid ? 'Desfazer Baixa' : 'Dar Baixa'}
                  </div>
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    Excluir
                    <span className="material-symbols-outlined">delete</span>
                  </div>
                </div>

                {/* Card Frontal */}
                <div
                  onClick={() => {
                    if (isSelecting) {
                      handleToggleSelection(t.id);
                    } else {
                      setEditingTransaction(t);
                    }
                  }}
                  className={`relative bg-card rounded-2xl p-3.5 border shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors z-10 ${
                    selectedIds.includes(t.id) ? 'border-primary ring-1 ring-primary/50' :
                    !isPaid ? 'border-amber-400/40' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSelecting && (
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${selectedIds.includes(t.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                        {selectedIds.includes(t.id) && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </div>
                    )}
                    {!isSelecting && (
                      <button
                        type="button"
                        title={isPaid ? 'Pago' : 'Pendente'}
                        onClick={(e) => handleTogglePaid(t, e)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                          isPaid
                            ? 'bg-[#1db576]/10 text-[#1db576]'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isPaid ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                        {!isPaid && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {categoryLabel[t.category_id] || t.category_id} · {new Date(t.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingTransaction(t); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors hidden sm:flex"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Edição & Baixa */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null)
          router.refresh()
        }}
      />

      <ConfirmModal 
        isOpen={Boolean(transactionToDelete)}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      />

      {/* Floating Bulk Actions Bar */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: selectedIds.length > 0 ? 0 : 100, opacity: selectedIds.length > 0 ? 1 : 0 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-card shadow-2xl border border-border rounded-2xl p-4 z-50 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">{selectedIds.length} selecionados</span>
          <button onClick={handleSelectAll} className="text-xs font-bold text-primary">
            {selectedIds.length === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleBulkToggle(true)}
            className="flex items-center justify-center gap-2 bg-[#1db576]/10 text-[#1db576] font-bold text-xs py-3 rounded-xl hover:bg-[#1db576]/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Dar Baixa
          </button>
          <button 
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 font-bold text-xs py-3 rounded-xl hover:bg-rose-500/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            {isBulkDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </motion.div>
    </main>
  )
}
