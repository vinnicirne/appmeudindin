"use client"

import React, { useState, useTransition } from 'react'
import { 
  updateUserPlanStatusAction, 
  updateUserRoleAction, 
  createUserAction, 
  deleteUserAction,
  updateUserTrialAction,
  saveAffiliateForUserAction,
  removeAffiliateForUserAction
} from '@/app/actions/adminUserActions'

export interface AdminUserItem {
  id: string
  name: string | null
  email: string | null
  phone?: string | null
  role: string | null
  plan_status: string | null
  trial_ends_at?: string | null
  created_at: string
  is_affiliate?: boolean
  affiliate_code?: string | null
  affiliate_data?: {
    id?: string
    code: string
    commission_type: 'fixed' | 'percentage'
    commission_value: number
    pix_key?: string
    instagram?: string
    phone?: string
  }
}

interface Props {
  users: AdminUserItem[]
  currentUserId: string
}

export function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form states para criar usuário
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPlanStatus, setNewPlanStatus] = useState<'active' | 'pending' | 'blocked'>('active')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')
  const [tempPassAlert, setTempPassAlert] = useState<string | null>(null)

  // Modal de Parceria / Afiliado
  const [affiliateModalUser, setAffiliateModalUser] = useState<AdminUserItem | null>(null)
  const [affCode, setAffCode] = useState('')
  const [affCommType, setAffCommType] = useState<'fixed' | 'percentage'>('percentage')
  const [affCommValue, setAffCommValue] = useState('30')
  const [affPixKey, setAffPixKey] = useState('')
  const [affInstagram, setAffInstagram] = useState('')
  const [affPhone, setAffPhone] = useState('')


  const filtered = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchSearch) return false

    if (statusFilter === 'active') return u.plan_status === 'active'
    if (statusFilter === 'pending') return u.plan_status === 'pending' || !u.plan_status
    if (statusFilter === 'blocked') return u.plan_status === 'blocked'
    return true
  })

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    setTempPassAlert(null)

    startTransition(async () => {
      const res = await createUserAction({
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        password: newPassword || undefined,
        planStatus: newPlanStatus,
        role: newRole,
      })

      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        const created: AdminUserItem = {
          id: res.userId!,
          name: newName,
          email: newEmail,
          phone: newPhone || null,
          role: newRole,
          plan_status: newPlanStatus,
          created_at: new Date().toISOString(),
        }
        setUsers(prev => [created, ...prev])
        setFeedback({ type: 'success', message: 'Usuário cadastrado com sucesso!' })
        if (res.temporaryPassword) {
          setTempPassAlert(`Senha gerada automaticamente para o usuário: ${res.temporaryPassword}`)
        }
        setIsCreatingUser(false)
        setNewName('')
        setNewEmail('')
        setNewPhone('')
        setNewPassword('')
      }
    })
  }

  function handleStatusChange(userId: string, newStatus: 'active' | 'pending' | 'blocked') {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateUserPlanStatusAction(userId, newStatus)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, plan_status: newStatus } : u))
        )
        setFeedback({ type: 'success', message: 'Assinatura/Status atualizado com sucesso!' })
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, plan_status: newStatus })
        }
      }
    })
  }

  function handleTrialChange(userId: string, daysToAdd: number | null) {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateUserTrialAction(userId, daysToAdd)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        let trialEndsAt = null
        let newStatus = 'expired'
        if (daysToAdd !== null) {
          const date = new Date()
          date.setDate(date.getDate() + daysToAdd)
          trialEndsAt = date.toISOString()
          newStatus = 'trial'
        }
        
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, plan_status: newStatus, trial_ends_at: trialEndsAt } : u))
        )
        setFeedback({ type: 'success', message: daysToAdd ? `Teste de ${daysToAdd} dias ativado com sucesso!` : 'Teste removido.' })
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, plan_status: newStatus, trial_ends_at: trialEndsAt })
        }
      }
    })
  }

  function handleRoleChange(userId: string, targetRole: 'user' | 'admin') {
    if (userId === currentUserId && targetRole !== 'admin') {
      alert('Vocêê não pode remover seu próprio privilégio de administrador.')
      return
    }
    setFeedback(null)
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, targetRole)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, role: targetRole } : u))
        )
        setFeedback({ type: 'success', message: 'Permissão do usuário atualizada com sucesso!' })
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, role: targetRole })
        }
      }
    })
  }

  
  function handleOpenAffiliateModal(u: AdminUserItem) {
    setAffiliateModalUser(u)
    const existing = u.affiliate_data
    const defaultCode = u.affiliate_code || existing?.code || (u.name ? u.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) : u.email?.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 10) || 'parceiro')

    setAffCode(defaultCode)
    setAffCommType(existing?.commission_type || 'percentage')
    setAffCommValue(existing ? String(existing.commission_value) : '30')
    setAffPixKey(existing?.pix_key || '')
    setAffInstagram(existing?.instagram || '')
    setAffPhone(existing?.phone || u.phone || '')
  }

  function handleSaveAffiliateModal(e: React.FormEvent) {
    e.preventDefault()
    if (!affiliateModalUser) return
    const cleanCode = affCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanCode) {
      alert('Informe um código de link válido (apenas letras e números).')
      return
    }

    setFeedback(null)
    startTransition(async () => {
      const res = await saveAffiliateForUserAction({
        userId: affiliateModalUser.id,
        code: cleanCode,
        commissionType: affCommType,
        commissionValue: Number(affCommValue) || 30,
        pixKey: affPixKey.trim() || undefined,
        instagram: affInstagram.trim() || undefined,
        phone: affPhone.trim() || undefined
      })

      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        const updatedData = {
          code: cleanCode,
          commission_type: affCommType,
          commission_value: Number(affCommValue) || 30,
          pix_key: affPixKey.trim(),
          instagram: affInstagram.trim(),
          phone: affPhone.trim()
        }

        setUsers(prev => prev.map(u => u.id === affiliateModalUser.id ? {
          ...u,
          is_affiliate: true,
          affiliate_code: cleanCode,
          affiliate_data: updatedData
        } : u))

        if (selectedUser && selectedUser.id === affiliateModalUser.id) {
          setSelectedUser({
            ...selectedUser,
            is_affiliate: true,
            affiliate_code: cleanCode,
            affiliate_data: updatedData
          })
        }

        setFeedback({ type: 'success', message: 'Parceria de afiliado salva com sucesso!' })
        setAffiliateModalUser(null)
      }
    })
  }

  function handleRemoveAffiliate(userId: string) {
    if (!confirm('Tem certeza que deseja remover este usuário do programa de parceiros?')) return
    setFeedback(null)
    startTransition(async () => {
      const res = await removeAffiliateForUserAction(userId)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          is_affiliate: false,
          affiliate_code: null,
          affiliate_data: undefined
        } : u))

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...selectedUser,
            is_affiliate: false,
            affiliate_code: null,
            affiliate_data: undefined
          })
        }
        setFeedback({ type: 'success', message: 'Status de parceiro removido.' })
      }
    })
  }

  function handleDeleteUser(userId: string) {
    if (userId === currentUserId) {
      alert('Vocêê não pode excluir sua própria conta enquanto estiver logado.')
      return
    }
    if (!confirm('Tem certeza que deseja excluir permanentemente este usuário?')) return

    setFeedback(null)
    startTransition(async () => {
      const res = await deleteUserAction(userId)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId))
        if (selectedUser?.id === userId) setSelectedUser(null)
        setFeedback({ type: 'success', message: 'Usuário excluído com sucesso!' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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

      {/* Alerta de Senha Provisória */}
      {tempPassAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-amber-500">key</span>
            <span>{tempPassAlert}</span>
          </div>
          <button onClick={() => setTempPassAlert(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Barra de Ações Rápidas: Busca, Filtros e Botão Novo Usuário */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border/60 rounded-xl outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-xs h-8 rounded-lg"
              >
                Todos ({users.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className="text-xs h-8 rounded-lg text-[#1db576]"
              >
                Ativos ({users.filter((u) => u.plan_status === 'active').length})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="text-xs h-8 rounded-lg text-amber-500"
              >
                Pendentes ({users.filter((u) => u.plan_status === 'pending' || !u.plan_status).length})
              </Button>
            </div>

            <Button
              onClick={() => setIsCreatingUser(true)}
              className="text-xs h-8 rounded-xl font-bold flex items-center gap-1.5 ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Novo Usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Principal: Tabela + Painel Lateral de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Usuários */}
        <div className={selectedUser ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Lista de Usuários ({filtered.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Controle de acesso, permissões e liberação/remoção manual de assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Nenhum usuário encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                        <th className="pb-3 pl-2">Usuário</th>
                        <th className="pb-3">E-mail</th>
                        <th className="pb-3">Perfil</th>
                        <th className="pb-3">Assinatura</th>
                        <th className="pb-3 text-right pr-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filtered.map((u) => {
                        const isActive = u.plan_status === 'active'
                        const isPending = u.plan_status === 'pending' || !u.plan_status
                        const isBlocked = u.plan_status === 'blocked'
                        const isAdmin = u.role === 'admin'
                        const isSelected = selectedUser?.id === u.id

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-muted/40 transition-colors ${
                              isSelected ? 'bg-primary/5 font-medium' : ''
                            }`}
                          >
                            <td className="py-3.5 pl-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate">
                                    {u.name || 'Sem nome'}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {u.created_at
                                      ? `Criado em ${new Date(u.created_at).toLocaleDateString('pt-BR')}`
                                      : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 text-muted-foreground">
                              <p className="font-medium text-foreground">{u.email || '—'}</p>
                              {u.phone && (
                                <p className="text-[10px] text-[#1db576] flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[11px]">chat</span>
                                  {u.phone}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5">
                              {isAdmin ? (
                                <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Usuário
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5">
                              {isActive && (
                                <Badge className="bg-[#1db576]/15 text-[#1db576] border-[#1db576]/30 text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1db576] mr-1 inline-block" />
                                  Assinatura Ativa
                                </Badge>
                              )}
                              {isPending && (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
                                  Pendente
                                </Badge>
                              )}
                              {isBlocked && (
                                <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1 inline-block" />
                                  Sem Acesso
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5 text-right pr-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(isSelected ? null : u)}
                                className="text-xs h-7 rounded-lg"
                              >
                                {isSelected ? 'Fechar' : 'Gerenciar'}
                              </Button>
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

        {/* Painel Lateral de Detalhes e Ações Rápidas */}
        {selectedUser && (
          <div className="lg:col-span-1">
            <Card className="border-border/60 bg-card shadow-sm sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold text-foreground">Gerenciar Usuário</CardTitle>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Cabeçalho do Usuário */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                    {(selectedUser.name || selectedUser.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {selectedUser.name || 'Sem nome'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{selectedUser.email}</p>
                    {selectedUser.phone && (
                      <p className="text-[11px] text-[#1db576] font-semibold flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-xs">chat</span>
                        {selectedUser.phone}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 truncate">
                      ID: {selectedUser.id}
                    </p>
                  </div>
                </div>

                {/* Ações de Assinatura (Adicionar / Remover) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground block">
                    Período de Teste (Gratuito)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleTrialChange(selectedUser.id, 7)}
                      className="text-[10px] h-8 rounded-xl font-bold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
                    >
                      + 7 Dias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleTrialChange(selectedUser.id, 15)}
                      className="text-[10px] h-8 rounded-xl font-bold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
                    >
                      + 15 Dias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleTrialChange(selectedUser.id, 30)}
                      className="text-[10px] h-8 rounded-xl font-bold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
                    >
                      + 30 Dias
                    </Button>
                  </div>
                  {selectedUser.plan_status === 'trial' && selectedUser.trial_ends_at && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Vence em: {new Date(selectedUser.trial_ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}

                  <hr className="my-3 border-border/50" />

                  <label className="text-xs font-bold text-foreground block">
                    Acesso Pago Permanente
                  </label>
                  <div className="flex flex-col gap-2">
                    {selectedUser.plan_status === 'active' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedUser.id, 'blocked')}
                        className="text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">block</span>
                        Bloquear Acesso
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedUser.id, 'active')}
                        className="text-xs h-9 rounded-xl bg-[#1db576] hover:bg-[#1db576]/90 text-white flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Ativar Pagante (Ilimitado)
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant={selectedUser.plan_status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedUser.id, 'pending')}
                        className="text-xs h-8 rounded-xl"
                      >
                        Marcar Pendente
                      </Button>
                      <Button
                        variant={selectedUser.plan_status === 'blocked' ? 'destructive' : 'outline'}
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedUser.id, 'blocked')}
                        className="text-xs h-8 rounded-xl"
                      >
                        Bloquear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Ações de Permissão (Role) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-xs font-bold text-foreground block">
                    Nível de Permissão
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedUser.role === 'user' || !selectedUser.role ? 'default' : 'outline'}
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(selectedUser.id, 'user')}
                      className="text-xs h-8 rounded-xl"
                    >
                      Usuário Padrão
                    </Button>
                    <Button
                      variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(selectedUser.id, 'admin')}
                      className={`text-xs h-8 rounded-xl ${
                        selectedUser.role === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : ''
                      }`}
                    >
                      Administrador
                    </Button>
                  </div>
                </div>

                {/* Afiliado / Parceiro */}
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground block">
                      Programa de Parceiros
                    </label>
                    {selectedUser.is_affiliate && (
                      <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full">
                        Parceiro Ativo
                      </span>
                    )}
                  </div>

                  {selectedUser.is_affiliate ? (
                    <div className="bg-muted/40 border border-border/70 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Código do Link</span>
                        <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                          {selectedUser.affiliate_code || selectedUser.affiliate_data?.code || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Comissão</span>
                        <span className="font-bold text-foreground">
                          {selectedUser.affiliate_data?.commission_type === 'fixed' 
                            ? `R$ ${selectedUser.affiliate_data.commission_value.toFixed(2)} / venda` 
                            : `${selectedUser.affiliate_data?.commission_value || 30}% por venda`}
                        </span>
                      </div>

                      {selectedUser.affiliate_data?.pix_key && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Chave PIX</span>
                          <span className="font-mono font-medium text-foreground truncate max-w-[140px]">
                            {selectedUser.affiliate_data.pix_key}
                          </span>
                        </div>
                      )}

                      {selectedUser.affiliate_data?.instagram && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Instagram</span>
                          <span className="font-medium text-pink-600">
                            {selectedUser.affiliate_data.instagram}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleOpenAffiliateModal(selectedUser)}
                          className="text-xs h-8 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-sm mr-1">edit</span>
                          Editar Dados
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleRemoveAffiliate(selectedUser.id)}
                          className="text-xs h-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                        >
                          Desativar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleOpenAffiliateModal(selectedUser)}
                      className="w-full text-xs h-9 rounded-xl font-bold flex items-center justify-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
                    >
                      <span className="material-symbols-outlined text-sm">handshake</span>
                      Configurar Parceria / Tornar Afiliado
                    </Button>
                  )}
                </div>

                {/* Excluir Conta de Usuário */}
                <div className="pt-2 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || selectedUser.id === currentUserId}
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full text-xs h-8 rounded-xl text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Excluir Usuário Permanentemente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Novo Usuário */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Novo Usuário</h3>
                <p className="text-xs text-muted-foreground">Cadastre um cliente e configure a assinatura</p>
              </div>
              <button onClick={() => setIsCreatingUser(false)} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ex: João Silva"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="ex: joao@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">WhatsApp / Telefone (Opcional)</label>
                <input
                  type="tel"
                  placeholder="ex: (11) 99999-9999"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Senha (Opcional - deixe vazio para gerar)</label>
                <input
                  type="password"
                  placeholder="Definir senha ou gerar aleatória"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Assinatura Inicial</label>
                  <select
                    value={newPlanStatus}
                    onChange={e => setNewPlanStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                  >
                    <option value="active">Liberar Ativo</option>
                    <option value="pending">Pendente (Checkout)</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Privilégio</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border/60 rounded-xl outline-none focus:border-primary text-foreground"
                  >
                    <option value="user">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button type="button" variant="ghost" onClick={() => setIsCreatingUser(false)} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="text-xs h-9 rounded-xl font-bold">
                  {isPending ? 'Criando...' : 'Cadastrar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Modal: Configurar Parceria de Afiliado */}
      {affiliateModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <span>🤝</span>
                  <span>Parceria de Afiliado</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Parceiro: <strong className="text-foreground">{affiliateModalUser.name || affiliateModalUser.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setAffiliateModalUser(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAffiliateModal} className="space-y-4">
              {/* Código do Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Código do Link Exclusivo *
                </label>
                <input
                  type="text"
                  required
                  value={affCode}
                  onChange={(e) => setAffCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="Ex: angeltheo, soucamilis, maria20"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-muted-foreground">
                  Gera os links com: <code className="text-primary font-bold">?ref={affCode || 'codigo'}</code>
                </p>
              </div>

              {/* Tipo e Valor da Comissão */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tipo de Comissão
                  </label>
                  <select
                    value={affCommType}
                    onChange={(e: any) => setAffCommType(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {affCommType === 'percentage' ? 'Comissão (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={affCommType === 'percentage' ? '1' : '0.01'}
                    required
                    value={affCommValue}
                    onChange={(e) => setAffCommValue(e.target.value)}
                    placeholder="30"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Chave PIX (para Repasses)
                </label>
                <input
                  type="text"
                  value={affPixKey}
                  onChange={(e) => setAffPixKey(e.target.value)}
                  placeholder="CPF, E-mail, Telefone ou Aleatória"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Instagram e WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Instagram (Opcional)
                  </label>
                  <input
                    type="text"
                    value={affInstagram}
                    onChange={(e) => setAffInstagram(e.target.value)}
                    placeholder="@perfil"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    value={affPhone}
                    onChange={(e) => setAffPhone(e.target.value)}
                    placeholder="5521999999999"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAffiliateModalUser(null)}
                  disabled={isPending}
                  className="flex-1 h-11 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] h-11 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isPending ? 'Salvando...' : 'Salvar e Ativar Parceria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>