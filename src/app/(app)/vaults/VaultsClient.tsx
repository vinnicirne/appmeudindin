'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardData } from '@/hooks/useDashboardData'
import { createVaultAction, updateVaultAction, deleteVaultAction, addVaultTransactionAction } from '@/app/actions/vaultActions'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function VaultsClient() {
  const { data, isLoading } = useDashboardData()
  const queryClient = useQueryClient()
  
  const vaults = data?.vaults || []
  const totalInVaults = data?.totalInVaults || 0

  const [isCreating, setIsCreating] = useState(false)
  const [selectedVault, setSelectedVault] = useState<any | null>(null)
  
  // Create/Edit State
  const [name, setName] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [color, setColor] = useState('bg-blue-500')
  const [icon, setIcon] = useState('savings')
  const [isSaving, setIsSaving] = useState(false)
  
  // Transaction State
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'YIELD'>('DEPOSIT')
  const [txAmount, setTxAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-[#1db576]', 'bg-amber-500', 'bg-red-500', 'bg-pink-500', 'bg-cyan-500'
  ]
  
  const icons = [
    'savings', 'flight_takeoff', 'home', 'directions_car', 'school', 'health_and_safety', 'emergency', 'favorite'
  ]

  function openCreate() {
    setName('')
    setGoalAmount('')
    setColor('bg-blue-500')
    setIcon('savings')
    setSelectedVault(null)
    setIsCreating(true)
  }

  function openEdit(vault: any) {
    setName(vault.name)
    setGoalAmount(vault.goal_amount ? vault.goal_amount.toString() : '')
    setColor(vault.color || 'bg-blue-500')
    setIcon(vault.icon || 'savings')
    setSelectedVault(vault)
    setIsCreating(true)
  }

  function handleCurrencyChange(val: string, setter: (v: string) => void) {
    let clean = val.replace(/\D/g, '')
    if (clean === '') { setter(''); return }
    const numberValue = parseInt(clean, 10) / 100
    setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  async function handleSaveVault(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Dê um nome para a caixinha')

    setIsSaving(true)
    const normalizedGoal = goalAmount ? parseFloat(goalAmount.replace(/\./g, '').replace(',', '.')) : undefined

    let res;
    if (selectedVault) {
      res = await updateVaultAction(selectedVault.id, { name, goal_amount: normalizedGoal, color, icon })
    } else {
      res = await createVaultAction({ name, goal_amount: normalizedGoal, color, icon })
    }

    setIsSaving(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(selectedVault ? 'Caixinha atualizada!' : 'Caixinha criada!')
      setIsCreating(false)
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  async function handleDeleteVault(id: string) {
    if (!confirm('Tem certeza? Todo o histórico será apagado e o saldo voltará a ficar disponível.')) return
    const res = await deleteVaultAction(id)
    if (res?.error) toast.error(res.error)
    else {
      toast.success('Caixinha excluída!')
      setSelectedVault(null)
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVault) return
    const amount = parseFloat(txAmount.replace(/\./g, '').replace(',', '.'))
    if (!amount || amount <= 0) return toast.error('Insira um valor válido')

    if (txType === 'WITHDRAWAL' && amount > selectedVault.balance) {
      return toast.error('Saldo insuficiente na caixinha para resgate')
    }

    setIsProcessing(true)
    const res = await addVaultTransactionAction(selectedVault.id, txType, amount)
    setIsProcessing(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Movimentação registrada!')
      setTxAmount('')
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">
      <div className="flex items-center justify-between mb-6 mt-2 px-2">
        <h1 className="text-xl font-bold text-foreground">Caixinhas</h1>
        <button 
          onClick={openCreate}
          className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 mb-6 flex flex-col relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Total Guardado</p>
        <p className="text-3xl font-black text-foreground mb-1">{formatCurrency(totalInVaults)}</p>
        <p className="text-xs text-muted-foreground">Rendendo e protegido.</p>
      </motion.div>

      {vaults.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center px-4 border border-dashed rounded-3xl bg-card border-border/50">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <p className="font-bold text-foreground text-sm">Nenhuma Caixinha</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Crie caixinhas para organizar suas economias por objetivo.
          </p>
          <button 
            onClick={openCreate}
            className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-sm"
          >
            Criar Caixinha
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {vaults.map((v: any) => {
            const hasGoal = !!v.goal_amount
            const percentage = hasGoal ? Math.min((v.balance / v.goal_amount) * 100, 100) : 0
            const isSelected = selectedVault?.id === v.id && !isCreating

            return (
              <motion.div 
                key={v.id}
                layout
                className={`bg-card rounded-3xl shadow-sm border overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50'}`}
              >
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => {
                    setSelectedVault(isSelected ? null : v)
                    setIsCreating(false)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${v.color || 'bg-blue-500'} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                      <span className="material-symbols-outlined">{v.icon || 'savings'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">{v.name}</h3>
                      <p className="text-lg font-black text-foreground mt-0.5">{formatCurrency(v.balance)}</p>
                    </div>
                    <span className={`material-symbols-outlined text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>

                  {hasGoal && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
                        <span>Progresso</span>
                        <span>{percentage.toFixed(1)}% de {formatCurrency(v.goal_amount)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full ${v.color || 'bg-blue-500'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 bg-muted/10 px-5 py-4"
                    >
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => openEdit(v)} className="flex-1 py-2 bg-card border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors flex justify-center items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">edit</span> Editar Meta
                        </button>
                        <button onClick={() => handleDeleteVault(v.id)} className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors flex justify-center items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">delete</span> Excluir
                        </button>
                      </div>

                      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-center">Movimentar Valor</h4>
                        
                        <div className="flex bg-muted p-1 rounded-xl mb-4">
                          <button onClick={() => setTxType('DEPOSIT')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${txType === 'DEPOSIT' ? 'bg-[#1db576] text-white shadow-sm' : 'text-muted-foreground'}`}>
                            Guardar
                          </button>
                          <button onClick={() => setTxType('WITHDRAWAL')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${txType === 'WITHDRAWAL' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                            Resgatar
                          </button>
                          <button onClick={() => setTxType('YIELD')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${txType === 'YIELD' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground'}`}>
                            Rendeu
                          </button>
                        </div>

                        <form onSubmit={handleTransaction} className="flex gap-2">
                          <input 
                            type="text"
                            value={txAmount}
                            onChange={(e) => handleCurrencyChange(e.target.value, setTxAmount)}
                            placeholder="R$ 0,00"
                            className="flex-1 bg-muted border border-border rounded-xl px-3 text-sm font-bold focus:outline-none focus:border-primary/50 text-right"
                          />
                          <button 
                            type="submit"
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-xl text-white font-bold transition-opacity disabled:opacity-50 flex items-center justify-center ${
                              txType === 'DEPOSIT' ? 'bg-[#1db576]' : txType === 'WITHDRAWAL' ? 'bg-primary' : 'bg-blue-500'
                            }`}
                          >
                            {isProcessing ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : 'Confirmar'}
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-card w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/50 p-6 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground text-xl tracking-tight">
                  {selectedVault ? 'Editar Caixinha' : 'Nova Caixinha'}
                </h3>
                <button onClick={() => setIsCreating(false)} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveVault} className="flex flex-col gap-5 overflow-y-auto pb-4 scrollbar-hide">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Nome do Objetivo</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Viagem para Europa"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Meta (Opcional)</label>
                  <input 
                    type="text"
                    value={goalAmount}
                    onChange={e => handleCurrencyChange(e.target.value, setGoalAmount)}
                    placeholder="R$ 0,00"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">Cor</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {colors.map(c => (
                      <button 
                        key={c} type="button" onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-full flex-shrink-0 ${c} border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">Ícone</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {icons.map(i => (
                      <button 
                        key={i} type="button" onClick={() => setIcon(i)}
                        className={`w-12 h-12 rounded-2xl flex-shrink-0 bg-muted flex items-center justify-center transition-all ${icon === i ? 'ring-2 ring-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <span className="material-symbols-outlined">{i}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full mt-2 bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-sm disabled:opacity-70"
                >
                  {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Salvar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
