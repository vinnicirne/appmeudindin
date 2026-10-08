'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, Link2, Download, Copy, Trash2, Phone, Printer } from 'lucide-react'
import { createAffiliateAction, deleteAffiliateAction, updateAffiliateAction } from '@/app/actions/affiliateActions'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

export default function AffiliatesClient({ initialAffiliates }: { initialAffiliates: any[] }) {
  const [affiliates, setAffiliates] = useState(initialAffiliates)

  useEffect(() => {
    setAffiliates(initialAffiliates)
  }, [initialAffiliates])
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editAffiliate, setEditAffiliate] = useState<any | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [reportAffiliate, setReportAffiliate] = useState<any | null>(null)

  const filtered = affiliates.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    const form = e.currentTarget
    
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      code: (form.elements.namedItem('code') as HTMLInputElement).value.toLowerCase().replace(/\s/g, ''),
      commissionType: (form.elements.namedItem('commissionType') as HTMLSelectElement).value as 'fixed' | 'percentage',
      commissionValue: Number((form.elements.namedItem('commissionValue') as HTMLInputElement).value),
      pixKey: (form.elements.namedItem('pixKey') as HTMLInputElement).value,
      instagram: (form.elements.namedItem('instagram') as HTMLInputElement)?.value || '',
      phone: (form.elements.namedItem('phone') as HTMLInputElement)?.value || ''
    }

    const res = await createAffiliateAction(formData)
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Parceiro adicionado!')
      setIsAddOpen(false)
      window.location.reload()
    }
  }

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editAffiliate) return
    setIsPending(true)
    const form = e.currentTarget
    
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      code: (form.elements.namedItem('code') as HTMLInputElement).value.toLowerCase().replace(/\s/g, ''),
      commissionType: (form.elements.namedItem('commissionType') as HTMLSelectElement).value as 'fixed' | 'percentage',
      commissionValue: Number((form.elements.namedItem('commissionValue') as HTMLInputElement).value),
      pixKey: (form.elements.namedItem('pixKey') as HTMLInputElement).value,
      instagram: (form.elements.namedItem('instagram') as HTMLInputElement)?.value || '',
      phone: (form.elements.namedItem('phone') as HTMLInputElement)?.value || ''
    }

    const res = await updateAffiliateAction(editAffiliate.id, formData)
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Parceiro atualizado!')
      setEditAffiliate(null)
      window.location.reload()
    }
  }

  async function handleDelete(id: string) {
    if(!confirm('Tem certeza? Isso nÃ£o apagarÃ¡ os usuÃ¡rios jÃ¡ cadastrados com este link.')) return
    setIsPending(true)
    const res = await deleteAffiliateAction(id)
    setIsPending(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Parceiro removido.')
      window.location.reload()
    }
  }

  function copyLink(code: string) {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/cadastro?ref=${code}` : ''
    navigator.clipboard.writeText(link)
    toast.success('Link de afiliado copiado!')
  }

  function formatMoney(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou cÃ³digo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Novo Parceiro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {filtered.map(aff => (
          <div key={aff.id} className="bg-background border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base">{aff.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                      {aff.code}
                    </span>
                  </div>
                </div>
                                <div className="flex gap-1">
                  <button onClick={() => setEditAffiliate(aff)} className="text-muted-foreground hover:text-blue-500 transition-colors p-1">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(aff.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Cadastros</p>
                  <p className="font-semibold text-lg">{aff.metrics.signups}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Vendas Conf.</p>
                  <p className="font-semibold text-lg text-green-600">{aff.metrics.sales}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col mt-2 pt-4 border-t border-border gap-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {aff.instagram && (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-pink-600 hover:text-pink-700 hover:bg-pink-50" onClick={() => window.open(`https://instagram.com/${aff.instagram.replace('@','')}`, '_blank')}>
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                    </Button>
                  )}
                  {aff.phone && (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => window.open(`https://wa.me/${aff.phone.replace(/[^0-9]/g, '')}`, '_blank')}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Faturado</p>
                  <p className="font-bold text-[#1db576]">{formatMoney(aff.metrics.totalGenerated)}</p>
                </div>
                <div className="text-right shrink-0 border-l border-border/60 pl-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Comissão (A Pagar)</p>
                  <p className="font-bold text-primary">{formatMoney(aff.metrics.totalToPay)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full mt-1">
                <Button variant="outline" size="sm" onClick={() => copyLink(aff.code)} className="h-8 flex-1 text-xs rounded-lg">
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => setReportAffiliate(aff)} className="h-8 flex-1 text-xs rounded-lg border-primary text-primary hover:bg-primary/5">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Relatório
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border bg-background/50 print:hidden">
          <p className="text-muted-foreground text-sm">Nenhum parceiro encontrado.</p>
        </div>
      )}

      {/* Modal Novo Parceiro */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setIsAddOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background border border-border shadow-xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Novo Parceiro</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gere um link rastreÃ¡vel</p>
                </div>
                <button
                  onClick={() => !isPending && setIsAddOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Nome do Parceiro</label>
                  <input required name="name" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Maria Influencer" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">CÃ³digo do Link (sem espaÃ§os)</label>
                  <input required name="code" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-mono" placeholder="Ex: maria20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Tipo ComissÃ£o</label>
                    <select name="commissionType" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm">
                      <option value="fixed">Fixo (R$)</option>
                      <option value="percentage">Porcentagem (%)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Valor (R$ ou %)</label>
                    <input required name="commissionValue" type="number" step="0.01" min="0" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: 10" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Chave PIX (opcional)</label>
                  <input name="pixKey" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="CPF, Email ou Telefone" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Instagram (opcional)</label>
                    <input name="instagram" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="@usuario" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">WhatsApp (opcional)</label>
                    <input name="phone" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="5511999999999" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isPending} className="w-full h-11 rounded-xl">
                    {isPending ? 'Salvando...' : 'Criar Parceiro'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            {/* Modal Editar Parceiro */}
      <AnimatePresence>
        {editAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setEditAffiliate(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background border border-border shadow-xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Editar Parceiro</h2>
                  <p className="text-sm text-muted-foreground mt-1">Atualize os dados do afiliado</p>
                </div>
                <button
                  onClick={() => !isPending && setEditAffiliate(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Nome do Parceiro</label>
                  <input required defaultValue={editAffiliate.name} name="name" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Maria Influencer" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Código do Link (sem espaços)</label>
                  <input required defaultValue={editAffiliate.code} name="code" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-mono" placeholder="Ex: maria20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Tipo Comissão</label>
                    <select defaultValue={editAffiliate.commission_type} name="commissionType" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm">
                      <option value="fixed">Fixo (R$)</option>
                      <option value="percentage">Porcentagem (%)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Valor (R$ ou %)</label>
                    <input required defaultValue={editAffiliate.commission_value} name="commissionValue" type="number" step="0.01" min="0" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: 10" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Chave PIX (opcional)</label>
                  <input defaultValue={editAffiliate.pix_key} name="pixKey" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="CPF, Email ou Telefone" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Instagram (opcional)</label>
                    <input defaultValue={editAffiliate.instagram} name="instagram" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="@usuario" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">WhatsApp (opcional)</label>
                    <input defaultValue={editAffiliate.phone} name="phone" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm" placeholder="5511999999999" />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditAffiliate(null)} disabled={isPending} className="flex-1 h-11 rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1 h-11 rounded-xl">
                    {isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report View (Printable) */}
      <AnimatePresence>
        {reportAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-background sm:bg-background/80 backdrop-blur-sm print:static print:bg-transparent print:p-0 print:block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-h-[100dvh] sm:max-h-[90vh] sm:h-auto sm:max-w-md bg-background sm:border sm:border-border sm:shadow-2xl sm:rounded-2xl flex flex-col overflow-hidden print:border-none print:shadow-none print:w-full print:h-auto print:max-w-none print:overflow-visible"
            >
              {/* Header / Actions */}
              <div className="flex items-center justify-between p-4 border-b border-border print:hidden">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Copy className="w-5 h-5 text-primary" />
                  Relatório de Fechamento
                </h2>
                <button onClick={() => setReportAffiliate(null)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Content */}
              <div id="printable-report" className="p-5 space-y-5 flex-1 overflow-y-auto print:overflow-visible print:p-0">
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center text-center space-y-2 border-b border-border pb-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
                    $
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Meu DinDin</h1>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Relatório de Vendas</p>
                </div>

                {/* Affiliate Info */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Parceiro</p>
                      <p className="font-bold text-foreground text-lg">{reportAffiliate.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">CÃ³digo Promocional</p>
                      <p className="font-mono font-medium text-foreground bg-background px-2 py-1 rounded inline-block border border-border">
                        {reportAffiliate.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-border rounded-xl bg-card">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Cadastros Gerados</p>
                    <p className="text-3xl font-black text-foreground">{reportAffiliate.metrics.signups}</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-xl bg-card">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Vendas Confirmadas</p>
                    <p className="text-3xl font-black text-green-600">{reportAffiliate.metrics.sales}</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-bold text-muted-foreground uppercase">Total do Repasse</p>
                    <p className="text-2xl font-black text-primary">{formatMoney(reportAffiliate.metrics.totalToPay)}</p>
                  </div>
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Chave PIX Cadastrada</p>
                    <p className="font-medium text-foreground">{reportAffiliate.pix_key || 'NÃ£o informada'}</p>
                  </div>
                </div>
                
                                {reportAffiliate.salesDetails && reportAffiliate.salesDetails.length > 0 && (
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4">Detalhamento de Vendas</h3>
                    <div className="space-y-3">
                      {reportAffiliate.salesDetails.map((sale: any) => (
                        <div key={sale.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg border border-border/50 text-sm">
                          <div>
                            <p className="font-bold text-foreground">{sale.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString('pt-BR')} - {sale.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+{formatMoney(sale.commission)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-center text-xs text-muted-foreground pt-4">
                  Documento gerado automaticamente pelo sistema Meu DinDin em {new Date().toLocaleDateString('pt-BR')}.
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border bg-muted/20 flex gap-3 print:hidden">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReportAffiliate(null)}>
                  Fechar
                </Button>
                <Button onClick={printReport} className="flex-1 rounded-xl gap-2">
                  <Printer className="w-4 h-4" />
                  Salvar como PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}



