"use client"

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlanItem } from '@/types/plan'
import { savePlanAction, togglePlanStatusAction, deletePlanAction } from '@/app/actions/adminPlanActions'

interface Props {
  initialPlans: PlanItem[]
}

export function AdminPlansClient({ initialPlans }: Props) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans)
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form states
  const [formId, setFormId] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('29.00')
  const [formInterval, setFormInterval] = useState<'month' | 'year'>('year')
  const [formBadge, setFormBadge] = useState('')
  const [formFeatures, setFormFeatures] = useState('')
  const [formSortOrder, setFormSortOrder] = useState('1')

  function openEditModal(plan: PlanItem) {
    setIsCreating(false)
    setEditingPlan(plan)
    setFormId(plan.id)
    setFormName(plan.name)
    setFormDescription(plan.description || '')
    setFormPrice(String(plan.price))
    setFormInterval(plan.interval)
    setFormBadge(plan.badge || '')
    setFormFeatures(plan.features.join('\n'))
    setFormSortOrder(String(plan.sort_order))
  }

  function openCreateModal() {
    setIsCreating(true)
    setEditingPlan(null)
    setFormId('meu_dindin_' + Date.now().toString().slice(-4))
    setFormName('')
    setFormDescription('')
    setFormPrice('49.00')
    setFormInterval('year')
    setFormBadge('')
    setFormFeatures('Controle financeiro\nGráficos ilimitados\nSuporte')
    setFormSortOrder(String(plans.length + 1))
  }

  function closeModal() {
    setEditingPlan(null)
    setIsCreating(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    const featuresArray = formFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean)

    const updatedPlan: PlanItem = {
      id: formId.trim().toLowerCase().replace(/\s+/g, '_'),
      name: formName,
      description: formDescription || null,
      price: parseFloat(formPrice) || 0,
      interval: formInterval,
      features: featuresArray,
      is_active: editingPlan ? editingPlan.is_active : true,
      badge: formBadge.trim() || null,
      sort_order: parseInt(formSortOrder) || 1,
    }

    startTransition(async () => {
      const res = await savePlanAction(updatedPlan)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: 'Plano salvo com sucesso!' })
        setPlans(prev => {
          const exists = prev.some(p => p.id === updatedPlan.id)
          if (exists) {
            return prev.map(p => p.id === updatedPlan.id ? updatedPlan : p)
          }
          return [...prev, updatedPlan]
        })
        closeModal()
      }
    })
  }

  function handleToggleStatus(planId: string, currentStatus: boolean) {
    setFeedback(null)
    startTransition(async () => {
      const res = await togglePlanStatusAction(planId, currentStatus)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setPlans(prev =>
          prev.map(p => p.id === planId ? { ...p, is_active: !currentStatus } : p)
        )
        setFeedback({ type: 'success', message: 'Status do plano alterado!' })
      }
    })
  }

  function handleDelete(planId: string) {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return
    setFeedback(null)
    startTransition(async () => {
      const res = await deletePlanAction(planId)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setPlans(prev => prev.filter(p => p.id !== planId))
        setFeedback({ type: 'success', message: 'Plano excluído com sucesso!' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-[#1db576]/10 text-[#1db576] border border-[#1db576]/30'
              : 'bg-destructive/10 text-destructive border border-destructive/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Top Header Card com Ação de Criar */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Catálogo de Ofertas</h2>
            <p className="text-xs text-muted-foreground">
              Configure os planos oferecidos no checkout do Meu DinDin
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="w-full sm:w-auto text-xs h-9 rounded-xl flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Criar Novo Plano
          </Button>
        </CardContent>
      </Card>

      {/* Grid de Cards de Planos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`border-border/60 bg-card transition-all relative flex flex-col justify-between ${
              !plan.is_active ? 'opacity-60 grayscale' : 'hover:border-primary/50 shadow-sm'
            }`}
          >
            {plan.badge && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary text-primary-foreground font-bold text-[10px] tracking-wider">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-foreground">{plan.name}</CardTitle>
                  {!plan.is_active && (
                    <Badge variant="destructive" className="text-[10px]">
                      Inativo
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {plan.description || 'Sem descrição cadastrada'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    /{plan.interval === 'year' ? 'ano' : 'mês'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recursos Inclusos:
                  </p>
                  <ul className="space-y-1 text-xs text-foreground">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1db576] text-sm">check</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </div>

            {/* Ações do Card */}
            <div className="p-4 pt-0 border-t border-border/40 flex items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(plan)}
                className="text-xs h-8 rounded-xl flex-1"
              >
                <span className="material-symbols-outlined text-sm mr-1">edit</span>
                Editar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                className="text-xs h-8 rounded-xl px-2"
                title={plan.is_active ? 'Desativar Plano' : 'Ativar Plano'}
              >
                <span className="material-symbols-outlined text-sm">
                  {plan.is_active ? 'visibility_off' : 'visibility'}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleDelete(plan.id)}
                className="text-xs h-8 rounded-xl px-2 text-destructive hover:bg-destructive/10"
                title="Excluir Plano"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {(editingPlan || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isCreating ? 'Novo Plano' : `Editar ${editingPlan?.name}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Preencha as informações do plano de assinatura
                </p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Identificador Único (ID do Checkout)</label>
                <input
                  type="text"
                  required
                  disabled={!isCreating}
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  placeholder="ex: meu_dindin_anual"
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary disabled:opacity-50 text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Nome do Plano</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="ex: Plano Anual Oficial"
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Periodicidade</label>
                  <select
                    value={formInterval}
                    onChange={e => setFormInterval(e.target.value as 'month' | 'year')}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                  >
                    <option value="year">Anual (12 meses)</option>
                    <option value="month">Mensal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Badge / Destaque (Opcional)</label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={e => setFormBadge(e.target.value)}
                  placeholder="ex: MAIS POPULAR, NOVO"
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Descrição Curta</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="ex: Acesso completo por 12 meses"
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Recursos (1 por linha)</label>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={e => setFormFeatures(e.target.value)}
                  placeholder="Controle financeiro completo&#10;Gráficos e relatórios&#10;Suporte prioritário"
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary font-mono text-[11px] text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button type="button" variant="ghost" onClick={closeModal} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="text-xs h-9 rounded-xl font-bold">
                  {isPending ? 'Salvando...' : 'Salvar Plano'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
