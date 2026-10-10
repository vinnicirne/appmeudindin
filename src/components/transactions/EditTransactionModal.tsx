'use client'

import { useState } from 'react'
import { updateTransactionAction } from '@/app/actions/transactionActions'
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
  is_recurring?: boolean
}

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'moradia', label: 'Moradia' },
  { id: 'salario', label: 'Salário Mensal' },
  { id: 'lazer', label: 'Lazer & Entretenimento' },
  { id: 'saude', label: 'Saúde & Farmácia' },
  { id: 'outros', label: 'Outros' },
]

interface EditTransactionModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  if (!isOpen || !transaction) return null

  return (
    <EditTransactionForm
      transaction={transaction}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function EditTransactionForm({
  transaction,
  onClose,
  onSuccess,
}: {
  transaction: Transaction
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(transaction.type)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [description, setDescription] = useState(transaction.description)
  const [categoryId, setCategoryId] = useState(transaction.category_id)
  const [date, setDate] = useState(() => {
    try {
      const d = new Date(transaction.date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  })
  const [notes, setNotes] = useState(transaction.notes || '')
  const [isPaid, setIsPaid] = useState<boolean>(
    transaction.is_paid !== undefined ? transaction.is_paid : true
  )
  const [isRecurring, setIsRecurring] = useState<boolean>(
    transaction.is_recurring || false
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('id', transaction.id)
    formData.append('type', type)
    formData.append('amount', amount.replace(',', '.'))
    formData.append('description', description)
    formData.append('date', date)
    formData.append('categoryId', categoryId)
    formData.append('notes', notes)
    formData.append('isPaid', String(isPaid))
    formData.append('isRecurring', String(isRecurring))

    const res = await updateTransactionAction(formData)
    setLoading(false)

    if (res?.error) {
      toast.error('Erro: ' + res.error)
    } else {
      toast.success('Lançamento atualizado!')
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              edit
            </span>
            <h3 className="font-extrabold text-base text-foreground">
              Editar Lançamento
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 pb-32 sm:pb-6">
          {/* Tipo Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-2xl border border-border/50">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-xs">arrow_downward</span>
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-xs">arrow_upward</span>
              Receita
            </button>
          </div>

          {/* Status de Baixa / Pagamento */}
          <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/70 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-xl ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isPaid ? 'check_circle' : 'pending'}
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Status do Lançamento
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isPaid
                    ? (type === 'EXPENSE' ? 'Pago / Liquidado' : 'Recebido / Liquidado')
                    : (type === 'EXPENSE' ? 'Pendente de pagamento' : 'Pendente de recebimento')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                isPaid
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-400'
              }`}
            >
              {isPaid ? 'Dar Baixa ✓' : 'Marcar Pendente'}
            </button>
          </div>

          {/* Frequência (Fixa Mensal) */}
          <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/70 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-xl ${isRecurring ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                sync_alt
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Lançamento Fixo Mensal
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, representa uma conta recorrente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                isRecurring
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground border-border/50 hover:bg-muted/80'
              }`}
            >
              {isRecurring ? 'Sim ✓' : 'Não'}
            </button>
          </div>

          {/* Valor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Valor (R$)</label>
            <div className="flex items-center px-4 py-2.5 bg-background border border-border rounded-xl focus-within:border-primary transition-all">
              <span className={`text-sm font-extrabold mr-2 ${type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-bold text-foreground"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium text-foreground"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Categoria</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Cartão de crédito, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-normal text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
