'use client'

import { motion } from "framer-motion"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { deleteTransactionAction, togglePaidTransactionAction } from '@/app/actions/transactionActions'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { buildCategoryLabelMap } from '@/lib/utils'
import dynamic from 'next/dynamic'
const OnboardingTour = dynamic(() => import('@/components/ui/OnboardingTour').then(mod => mod.OnboardingTour), { ssr: false })

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

import { useDashboardData } from '@/hooks/useDashboardData'
import { useQueryClient } from '@tanstack/react-query'

export default function HomeClient() {
  const { data, isLoading } = useDashboardData()
  const transactions = data?.transactions || []
  const dbCategories = data?.categories || []
  const overallBalance = data?.overallBalance || 0

  const router = useRouter()
  const queryClient = useQueryClient()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
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

  const filtered = useMemo(() =>
    transactions.filter(t => {
      // Usando split() para evitar que o Javascript troque o dia por causa do fuso horário
      const parts = t.date.split('T')[0].split('-')
      if (parts.length >= 2) {
        const tYear = parseInt(parts[0], 10)
        const tMonth = parseInt(parts[1], 10) - 1
        return tYear === year && tMonth === month
      }
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [transactions, year, month]
  )

  const totalIncome = useMemo(() =>
    filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [filtered]
  )
  const totalExpense = useMemo(() =>
    filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    [filtered]
  )

  // Baixa / liquidadas do mês
  const paidCount = useMemo(() => filtered.filter(t => t.is_paid !== false).length, [filtered])
  const pendingCount = filtered.length - paidCount

  // Mapa real de categorias vindo do Supabase (ignora mock anterior)
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    dbCategories.forEach(cat => {
      map[cat.slug || cat.id] = cat.label || cat.name || cat.title || cat.slug
    })
    return map
  }, [dbCategories])

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
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); router.refresh()
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
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); router.refresh()
    }
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">
      {/* <OnboardingTour /> */}

      {/* Month Selector */}
      <motion.div
        suppressHydrationWarning
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 mt-2 px-4"
      >
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full"
        >
          <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h1>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full"
        >
          <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
        </button>
      </motion.div>

      {/* Saldo Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a5b48] text-white rounded-3xl p-5 shadow-sm mb-4 tour-balance"
      >
        <div className="flex flex-col gap-1 mb-3">
          <span className="text-white/80 text-xs font-semibold">Saldo Total Geral</span>
          <span className="text-3xl font-extrabold tracking-tight">{formatCurrency(overallBalance)}</span>
        </div>
        <div className="mb-4">
          <div className="inline-flex bg-[#23735b] px-3 py-1 rounded-full items-center gap-1.5">
            <span className="text-[11px] font-semibold text-white/95">
              {paidCount} baixado(s) {pendingCount > 0 ? `· ${pendingCount} pendente(s)` : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-3 tour-quick-add">
          <Link href="/add?type=INCOME" className="flex-1 bg-[#1db576] hover:bg-[#1db576]/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="text-sm">Receita</span>
          </Link>
          <Link href="/add?type=EXPENSE" className="flex-1 bg-[#e74c4c] hover:bg-[#e74c4c]/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-lg">remove</span>
            <span className="text-sm">Despesa</span>
          </Link>
        </div>
      </motion.div>

      {/* Resumo Mês */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground/70">
            <div className="w-6 h-6 rounded-full bg-[#1db576]/10 flex items-center justify-center text-[#1db576]">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            </div>
            <span className="text-xs font-semibold">Receitas</span>
          </div>
          <div>
            <p className="text-[#1db576] font-bold text-lg">{formatCurrency(totalIncome)}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">No mês selecionado</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground/70">
            <div className="w-6 h-6 rounded-full bg-[#e74c4c]/10 flex items-center justify-center text-[#e74c4c]">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </div>
            <span className="text-xs font-semibold">Despesas</span>
          </div>
          <div>
            <p className="text-[#e74c4c] font-bold text-lg">{formatCurrency(totalExpense)}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">No mês selecionado</p>
          </div>
        </div>
      </motion.div>



      {/* Transações */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col flex-1"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold text-foreground">Transações do Mês</h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {filtered.length} registro(s)
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState 
            icon="receipt_long" 
            title="Nenhuma movimentação neste mês" 
            description="Toque em + Receita ou + Despesa para registrar suas finanças." 
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((t) => {
              const isPaid = t.is_paid !== false
              return (
                <div
                  key={t.id}
                  onClick={() => setEditingTransaction(t)}
                  className={`bg-card rounded-2xl p-3.5 border shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all ${
                    !isPaid ? 'border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Botão de Dar Baixa */}
                    <button
                      type="button"
                      title={isPaid ? (t.type === 'INCOME' ? 'Recebido (toque para desfazer)' : 'Pago (toque para desfazer)') : (t.type === 'INCOME' ? 'A Receber (toque para dar baixa)' : 'A Pagar (toque para dar baixa)')}
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                        {isPaid ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#1db576]/10 text-[#1db576] shrink-0">
                            {t.type === 'INCOME' ? 'Recebido' : 'Pago'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            {t.type === 'INCOME' ? 'A Receber' : 'A Pagar'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {String(categoryMap[t.category_id] || t.category_id).charAt(0).toUpperCase() + String(categoryMap[t.category_id] || t.category_id).slice(1)} · {t.date.split('T')[0].split('-').reverse().join('/')}
                        {t.notes ? ` · ${t.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>

                    {/* Ações Rápidas */}
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
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Modal de Edição & Baixa */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null)
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); router.refresh()
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
