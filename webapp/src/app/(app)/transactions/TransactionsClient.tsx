'use client'

import * as motion from "framer-motion/client"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { deleteTransactionAction, togglePaidTransactionAction } from '@/app/actions/transactionActions'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

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
      toast.success(newStatus ? 'Marcado como pago!' : 'Marcado como pendente!')
      router.refresh()
    }
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

      {/* Search Input */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">search</span>
        <input
          type="text"
          placeholder="Pesquisar por descrição..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
        />
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center flex-1"
        >
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/40 mb-4">filter_list</span>
          <h3 className="font-bold text-sm text-foreground mb-1">Nenhuma transação encontrada</h3>
          <p className="text-xs text-muted-foreground">Tente alterar os filtros ou o mês selecionado</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => {
            const isPaid = t.is_paid !== false
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setEditingTransaction(t)}
                className={`bg-card rounded-2xl p-3.5 border shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all ${
                  !isPaid ? 'border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Botão de Dar Baixa */}
                  <button
                    type="button"
                    title={isPaid ? 'Liquidado (toque para marcar pendente)' : 'Pendente (toque para dar baixa)'}
                    onClick={(e) => handleTogglePaid(t, e)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                      isPaid
                        ? t.type === 'INCOME'
                          ? 'bg-[#1db576]/10 text-[#1db576]'
                          : 'bg-[#e74c4c]/10 text-[#e74c4c]'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isPaid ? (t.type === 'INCOME' ? 'arrow_upward' : 'arrow_downward') : 'schedule'}
                    </span>
                  </button>

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
                      {t.notes ? ` · ${t.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>

                  {/* Ações de Edição e Exclusão */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Editar lançamento"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTransaction(t)
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      type="button"
                      title="Excluir lançamento"
                      disabled={deletingId === t.id}
                      onClick={(e) => handleDelete(t.id, e)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
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
    </main>
  )
}
