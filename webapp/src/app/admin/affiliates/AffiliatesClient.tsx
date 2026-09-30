'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, Link2, Download, Copy, Trash2 } from 'lucide-react'
import { createAffiliateAction, deleteAffiliateAction } from '@/app/actions/affiliateActions'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

export default function AffiliatesClient({ initialAffiliates }: { initialAffiliates: any[] }) {
  const [affiliates, setAffiliates] = useState(initialAffiliates)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

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
      pixKey: (form.elements.namedItem('pixKey') as HTMLInputElement).value
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

  async function handleDelete(id: string) {
    if(!confirm('Tem certeza? Isso não apagará os usuários já cadastrados com este link.')) return
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

  function copyReport(aff: any) {
    const text = `Relatório de Vendas - Meu DinDin
Parceiro: ${aff.name}
Código: ${aff.code}

Cadastros Gerados: ${aff.metrics.signups}
Vendas Confirmadas: ${aff.metrics.sales}
----------------------------
Total a Receber: ${formatMoney(aff.metrics.totalToPay)}
Chave PIX: ${aff.pix_key || 'Não informada'}`
    
    navigator.clipboard.writeText(text)
    toast.success('Relatório copiado para a área de transferência!')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(aff => (
          <div key={aff.id} className="bg-background border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">{aff.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                    {aff.code}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(aff.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
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

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(aff.code)} className="h-8 px-3 text-xs rounded-lg">
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyReport(aff)} className="h-8 px-3 text-xs rounded-lg">
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Relatório
                </Button>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">A Pagar</p>
                <p className="font-bold text-primary">{formatMoney(aff.metrics.totalToPay)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border bg-background/50">
          <p className="text-muted-foreground text-sm">Nenhum parceiro encontrado.</p>
        </div>
      )}

      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-background border border-border shadow-xl rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Novo Parceiro</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gere um link rastreável</p>
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
                  <label className="text-xs font-semibold text-foreground/80">Código do Link (sem espaços)</label>
                  <input required name="code" type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-mono" placeholder="Ex: maria20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Tipo Comissão</label>
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
    </div>
  )
}