"use client"

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SubscriptionItem } from '@/types/subscription'
import { updateSubscriptionStatusAction } from '@/app/actions/adminSubscriptionActions'

interface Props {
  initialSubscriptions: SubscriptionItem[]
}

export function AdminSubscriptionsClient({ initialSubscriptions }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(initialSubscriptions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'canceled'>('all')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filtered = subscriptions.filter((sub) => {
    const matchText =
      sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchText) return false

    if (statusFilter === 'active') return sub.status === 'active'
    if (statusFilter === 'pending') return sub.status === 'pending'
    if (statusFilter === 'canceled') return sub.status === 'canceled'
    return true
  })

  const activeCount = subscriptions.filter(s => s.status === 'active').length
  const pendingCount = subscriptions.filter(s => s.status === 'pending').length
  const canceledCount = subscriptions.filter(s => s.status === 'canceled').length
  const totalRevenue = activeCount * 29.00

  function handleStatusChange(userId: string, newStatus: 'active' | 'pending' | 'canceled') {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateSubscriptionStatusAction(userId, newStatus)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setSubscriptions(prev =>
          prev.map(s => (s.userId === userId ? { ...s, status: newStatus } : s))
        )
        setFeedback({ type: 'success', message: 'Status da assinatura atualizado com sucesso!' })
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

      {/* KPI Cards de Assinaturas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Assinaturas Ativas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-[#1db576]/10 text-[#1db576] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#1db576]">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Acesso liberado no app</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Aguardando Pagamento
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hourglass_top</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Checkout pendente no MP</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Canceladas / Bloqueadas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">cancel</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{canceledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sem acesso ao sistema</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              MRR / ARR Estimado
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">monetization_on</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Em assinaturas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Assinaturas */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Lista de Assinaturas ({filtered.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Controle de pagamentos, expirações e intervenção manual de assinaturas
              </CardDescription>
            </div>

            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar assinatura ou cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="text-xs h-7 rounded-lg"
                >
                  Todas ({subscriptions.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                  className="text-xs h-7 rounded-lg text-[#1db576]"
                >
                  Ativas ({activeCount})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className="text-xs h-7 rounded-lg text-amber-500"
                >
                  Pendentes ({pendingCount})
                </Button>
                <Button
                  variant={statusFilter === 'canceled' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('canceled')}
                  className="text-xs h-7 rounded-lg text-destructive"
                >
                  Canceladas ({canceledCount})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              Nenhuma assinatura encontrada para esta busca.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="pb-3 pl-2">Cliente</th>
                    <th className="pb-3">Plano & Valor</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Data Contratação</th>
                    <th className="pb-3">Expira em</th>
                    <th className="pb-3 text-right pr-2">Ação Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((sub) => {
                    const isActive = sub.status === 'active'
                    const isPending = sub.status === 'pending'
                    const isCanceled = sub.status === 'canceled'

                    return (
                      <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pl-2">
                          <p className="font-semibold text-foreground">{sub.userName}</p>
                          <p className="text-[11px] text-muted-foreground">{sub.userEmail}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-foreground">{sub.planName}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)} / ano
                          </p>
                        </td>
                        <td className="py-3.5">
                          {isActive && (
                            <Badge className="bg-[#1db576]/15 text-[#1db576] border-[#1db576]/30 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1db576] mr-1 inline-block" />
                              Ativa
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
                              Pendente
                            </Badge>
                          )}
                          {isCanceled && (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1 inline-block" />
                              Cancelada
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleStatusChange(sub.userId, 'canceled')}
                              className="text-xs h-7 rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleStatusChange(sub.userId, 'active')}
                              className="text-xs h-7 rounded-lg text-[#1db576] hover:bg-[#1db576]/10"
                            >
                              Ativar
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
