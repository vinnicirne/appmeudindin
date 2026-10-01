'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { createGoalAction, updateGoalAction, updateGoalBalanceAction, deleteGoalAction } from '@/app/actions/goalActions'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  target_date?: string | null
  icon?: string
  color?: string
  created_at?: string
}

interface Props {
  initialGoals: Goal[]
}

const AVAILABLE_ICONS = [
  { name: 'directions_car', label: 'Carro' },
  { name: 'home', label: 'Casa' },
  { name: 'flight', label: 'Viagem' },
  { name: 'savings', label: 'Cofrinho' },
  { name: 'shield', label: 'Reserva' },
  { name: 'laptop_mac', label: 'Eletrônico' },
  { name: 'school', label: 'Estudos' },
  { name: 'diamond', label: 'Sonho' },
  { name: 'favorite', label: 'Casamento' },
  { name: 'sports_esports', label: 'Lazer' },
]

const AVAILABLE_COLORS = [
  { name: 'bg-emerald-500 text-white', label: 'Esmeralda', badge: 'bg-emerald-500' },
  { name: 'bg-blue-500 text-white', label: 'Azul', badge: 'bg-blue-500' },
  { name: 'bg-purple-500 text-white', label: 'Roxo', badge: 'bg-purple-500' },
  { name: 'bg-amber-500 text-white', label: 'Dourado', badge: 'bg-amber-500' },
  { name: 'bg-rose-500 text-white', label: 'Rosa', badge: 'bg-rose-500' },
  { name: 'bg-teal-500 text-white', label: 'Turquesa', badge: 'bg-teal-500' },
  { name: 'bg-indigo-500 text-white', label: 'Índigo', badge: 'bg-indigo-500' },
]

export default function PlanningClient({ initialGoals }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [balanceModalGoal, setBalanceModalGoal] = useState<{ goal: Goal; type: 'DEPOSIT' | 'WITHDRAW' } | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states for Create/Edit
  const [title, setTitle] = useState('')
  const [targetAmountRaw, setTargetAmountRaw] = useState('')
  const [initialAmountRaw, setInitialAmountRaw] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('savings')
  const [selectedColor, setSelectedColor] = useState('bg-emerald-500 text-white')

  // Form state for Balance Deposit/Withdraw
  const [balanceAmountRaw, setBalanceAmountRaw] = useState('')

  // Totals calculation
  const totalSaved = useMemo(() => goals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0), [goals])
  const totalTarget = useMemo(() => goals.reduce((acc, g) => acc + Number(g.target_amount || 0), 0), [goals])
  const globalProgress = useMemo(() => (totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0), [totalSaved, totalTarget])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const parseCurrencyInput = (val: string) => {
    const clean = val.replace(/\D/g, '')
    return clean ? Number(clean) / 100 : 0
  }

  const formatRawCurrencyInput = (num: number) => {
    return (num * 100).toFixed(0).replace(/\D/g, '')
  }

  function handleOpenCreate() {
    setEditingGoal(null)
    setTitle('')
    setTargetAmountRaw('')
    setInitialAmountRaw('')
    setTargetDate('')
    setSelectedIcon('savings')
    setSelectedColor('bg-emerald-500 text-white')
    setIsCreateModalOpen(true)
  }

  function handleOpenEdit(g: Goal) {
    setEditingGoal(g)
    setTitle(g.title)
    setTargetAmountRaw(formatRawCurrencyInput(g.target_amount))
    setInitialAmountRaw('')
    setTargetDate(g.target_date || '')
    setSelectedIcon(g.icon || 'savings')
    setSelectedColor(g.color || 'bg-emerald-500 text-white')
    setIsCreateModalOpen(true)
  }

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Informe o nome da meta.')
      return
    }

    const targetAmount = parseCurrencyInput(targetAmountRaw)
    if (targetAmount <= 0) {
      toast.error('O valor alvo deve ser maior que R$ 0,00.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingGoal) {
        const res = await updateGoalAction(editingGoal.id, {
          title: title.trim(),
          targetAmount,
          targetDate: targetDate || null,
          icon: selectedIcon,
          color: selectedColor
        })
        if (res?.error) throw new Error(res.error)

        setGoals(prev => prev.map(g => g.id === editingGoal.id ? {
          ...g,
          title: title.trim(),
          target_amount: targetAmount,
          target_date: targetDate || null,
          icon: selectedIcon,
          color: selectedColor
        } : g))
        toast.success('Meta atualizada com sucesso!')
      } else {
        const initialAmount = parseCurrencyInput(initialAmountRaw)
        const res = await createGoalAction({
          title: title.trim(),
          targetAmount,
          initialAmount,
          targetDate: targetDate || null,
          icon: selectedIcon,
          color: selectedColor
        })
        if (res?.error) throw new Error(res.error)

        // Add to local state (optimistic)
        const newGoal: Goal = {
          id: Math.random().toString(),
          user_id: '',
          title: title.trim(),
          target_amount: targetAmount,
          current_amount: initialAmount,
          target_date: targetDate || null,
          icon: selectedIcon,
          color: selectedColor
        }
        setGoals(prev => [newGoal, ...prev])
        toast.success('Nova meta criada com sucesso!')
      }

      setIsCreateModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao salvar meta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return
    setIsSubmitting(true)
    try {
      const res = await deleteGoalAction(deleteTargetId)
      if (res?.error) throw new Error(res.error)
      setGoals(prev => prev.filter(g => g.id !== deleteTargetId))
      toast.success('Meta excluída.')
      setDeleteTargetId(null)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao excluir meta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveBalance(e: React.FormEvent) {
    e.preventDefault()
    if (!balanceModalGoal) return

    const amount = parseCurrencyInput(balanceAmountRaw)
    if (amount <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    const delta = balanceModalGoal.type === 'DEPOSIT' ? amount : -amount
    setIsSubmitting(true)

    try {
      const res = await updateGoalBalanceAction(balanceModalGoal.goal.id, delta)
      if (res?.error) throw new Error(res.error)

      setGoals(prev => prev.map(g => g.id === balanceModalGoal.goal.id ? {
        ...g,
        current_amount: Math.max(0, Number(g.current_amount || 0) + delta)
      } : g))

      toast.success(balanceModalGoal.type === 'DEPOSIT' ? 'Valor guardado na meta!' : 'Valor resgatado!')
      setBalanceModalGoal(null)
      setBalanceAmountRaw('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ajustar saldo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* Header com Botão de Criar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>Metas & Sonhos</span>
            <span className="text-2xl">🎯</span>
          </h1>
          <p className="text-sm text-muted-foreground">Guarde dinheiro e acompanhe a realização dos seus objetivos.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Card de Resumo Geral */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Guardado em Metas</p>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-1">{formatCurrency(totalSaved)}</h2>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Objetivo Total Acumulado</p>
            <p className="text-lg font-extrabold text-primary mt-1">{formatCurrency(totalTarget)}</p>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            style={{ width: `${globalProgress}%` }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
          />
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span>{goals.length} {goals.length === 1 ? 'meta ativa' : 'metas ativas'}</span>
          <span className="text-primary font-black">{globalProgress.toFixed(1)}% alcançado</span>
        </div>
      </motion.div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 text-center border border-dashed border-border flex flex-col items-center gap-4 my-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <div className="max-w-sm">
            <h3 className="text-lg font-black text-foreground">Você ainda não tem metas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie objetivos como comprar um carro novo, fazer uma viagem ou criar sua reserva de emergência!
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm shadow-md hover:scale-105 transition-transform"
          >
            Criar Minha Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((g) => {
              const current = Number(g.current_amount || 0)
              const target = Number(g.target_amount || 0)
              const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
              const remaining = Math.max(0, target - current)
              const isCompleted = current >= target

              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card rounded-3xl p-5 shadow-sm border border-border/60 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  {/* Topo do Card */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${g.color || 'bg-emerald-500 text-white'}`}>
                          <span className="material-symbols-outlined text-2xl">{g.icon || 'savings'}</span>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-foreground line-clamp-1">{g.title}</h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            {g.target_date ? `Prazo: ${new Date(g.target_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : 'Sem prazo definido'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          title="Editar Meta"
                          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(g.id)}
                          title="Excluir Meta"
                          className="w-8 h-8 rounded-full hover:bg-rose-500/10 flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Guardado</span>
                        <p className="text-xl font-black text-foreground">{formatCurrency(current)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Meta</span>
                        <p className="text-sm font-bold text-muted-foreground">{formatCurrency(target)}</p>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="relative h-2.5 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className={isCompleted ? 'text-emerald-500 font-extrabold flex items-center gap-1' : 'text-muted-foreground'}>
                        {isCompleted ? (
                          <>
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Meta Concluída! 🎉
                          </>
                        ) : (
                          `Faltam ${formatCurrency(remaining)}`
                        )}
                      </span>
                      <span className="text-primary font-black">{percent.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Ações Rápidas: Guardar / Resgatar */}
                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => {
                        setBalanceModalGoal({ goal: g, type: 'DEPOSIT' })
                        setBalanceAmountRaw('')
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Guardar</span>
                    </button>

                    <button
                      onClick={() => {
                        setBalanceModalGoal({ goal: g, type: 'WITHDRAW' })
                        setBalanceAmountRaw('')
                      }}
                      disabled={current <= 0}
                      className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                      <span>Resgatar</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Criar / Editar Meta */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black text-foreground">
                  {editingGoal ? 'Editar Meta' : 'Nova Meta ou Sonho'}
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-4">
                {/* Nome da Meta */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Nome da Meta *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Carro Novo, Viagem para Paris, etc."
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>

                {/* Valor Alvo */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Valor Alvo (Objetivo) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targetAmountRaw ? (Number(targetAmountRaw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                      onChange={(e) => setTargetAmountRaw(e.target.value.replace(/\D/g, ''))}
                      placeholder="0,00"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-3 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Valor Inicial (somente ao criar) */}
                {!editingGoal && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Já tem algum valor guardado? (Opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={initialAmountRaw ? (Number(initialAmountRaw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                        onChange={(e) => setInitialAmountRaw(e.target.value.replace(/\D/g, ''))}
                        placeholder="0,00"
                        className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-3 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                      />
                    </div>
                  </div>
                )}

                {/* Data Limite / Prazo */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Data Alvo Estimada (Opcional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                {/* Escolha de Ícone */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Ícone
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        type="button"
                        key={ic.name}
                        onClick={() => setSelectedIcon(ic.name)}
                        className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                          selectedIcon === ic.name
                            ? 'bg-primary text-primary-foreground shadow-md scale-105'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title={ic.label}
                      >
                        <span className="material-symbols-outlined text-xl">{ic.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Escolha de Cor */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Cor de Destaque
                  </label>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`w-8 h-8 rounded-full ${c.badge} transition-transform flex items-center justify-center text-white ${
                          selectedColor === c.name ? 'ring-4 ring-primary/40 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        {selectedColor === c.name && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botões do Formulário */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      editingGoal ? 'Salvar Alterações' : 'Criar Meta'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Guardar / Resgatar Saldo */}
      <AnimatePresence>
        {balanceModalGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setBalanceModalGoal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center"
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${balanceModalGoal.type === 'DEPOSIT' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {balanceModalGoal.type === 'DEPOSIT' ? 'savings' : 'payments'}
                </span>
              </div>

              <h2 className="text-xl font-black text-foreground">
                {balanceModalGoal.type === 'DEPOSIT' ? 'Guardar Dinheiro' : 'Resgatar Valor'}
              </h2>
              <p className="text-xs text-muted-foreground font-medium mt-1 mb-4">
                Meta: <strong className="text-foreground">{balanceModalGoal.goal.title}</strong>
              </p>

              <form onSubmit={handleSaveBalance} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Valor a {balanceModalGoal.type === 'DEPOSIT' ? 'Adicionar' : 'Retirar'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={balanceAmountRaw ? (Number(balanceAmountRaw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                      onChange={(e) => setBalanceAmountRaw(e.target.value.replace(/\D/g, ''))}
                      placeholder="0,00"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-3.5 font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-xl"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBalanceModalGoal(null)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-[2] py-3.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center ${
                      balanceModalGoal.type === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      balanceModalGoal.type === 'DEPOSIT' ? 'Confirmar Depósito' : 'Confirmar Resgate'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Exclusão */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Excluir Meta?"
        description="Tem certeza que deseja excluir esta meta? O histórico e o progresso dela serão removidos."
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </main>
  )
}
