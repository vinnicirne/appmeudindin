'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface Signup {
  id: string
  name: string | null
  email: string | null
  plan_status: string | null
  created_at: string
}

interface Props {
  name: string
  code: string
  totalSignups: number
  totalSales: number
  recentSignups: Signup[]
  isAffiliate?: boolean
  commissionType?: string | null
  commissionValue?: number | null
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://meudindinapp.vercel.app'
const LANDING_PAGE_URL = process.env.NEXT_PUBLIC_LANDING_PAGE_URL || 'https://app-meudindin-pages.vercel.app'

export default function AffiliateClient({ 
  name, 
  code, 
  totalSignups, 
  totalSales, 
  recentSignups, 
  isAffiliate = true,
  commissionType,
  commissionValue
}: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!isAffiliate) {
    return (
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl p-8 border border-border shadow-xl text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">Área Restrita</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Você ainda não faz parte do nosso Programa de Parceiros. Solicite sua filiação ao nosso suporte para começar a indicar e ganhar comissões.
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=5521974976130&text=Ol%C3%A1!%20Sou%20usu%C3%A1rio%20do%20Meu%20DinDin%20e%20gostaria%20de%20me%20tornar%20um%20Parceiro%20Afiliado."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <span className="material-symbols-outlined">chat</span>
            Falar com Suporte
          </a>
        </motion.div>
      </main>
    )
  }

  const referralUrl = `${LANDING_PAGE_URL}?ref=${code}`

  function fallbackCopy(id: string, url: string) {
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopied(id)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(null), 2500)
    } catch {
      toast.error('Não foi possível copiar automaticamente.')
    } finally {
      document.body.removeChild(textArea)
    }
  }

  const handleCopyLink = async (id: string, url: string) => {
    if (!navigator?.clipboard) {
      fallbackCopy(id, url)
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(null), 2500)
    } catch (err) {
      fallbackCopy(id, url)
    }
  }

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  let commissionText = 'Não definida'
  if (commissionType === 'PERCENTAGE' && commissionValue) {
    commissionText = `${commissionValue}% por assinatura ativa`
  } else if (commissionType === 'FIXED' && commissionValue) {
    commissionText = `${formatMoney(commissionValue)} por assinatura ativa`
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col min-h-screen pb-24">
      
      <div className="flex items-center justify-between mb-8 mt-2 px-2">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Painel do Parceiro</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Seu Link de Indicação</h2>
          <p className="text-sm font-medium text-foreground mb-6">Compartilhe e ganhe comissões.</p>
          
          <div className="bg-muted border border-border rounded-xl p-3 flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-mono text-foreground truncate">{referralUrl}</span>
            <button 
              onClick={() => handleCopyLink('link', referralUrl)}
              className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
              title="Copiar Link"
            >
              <span className="material-symbols-outlined text-lg">
                {copied === 'link' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sua Comissão</p>
              <p className="text-sm font-bold text-foreground">{commissionText}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -z-10" />
            <span className="material-symbols-outlined text-blue-500 text-3xl mb-3">group</span>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Total de Indicados</p>
            <p className="text-3xl font-black text-foreground">{totalSignups}</p>
          </div>
          
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1db576]/5 rounded-bl-full -z-10" />
            <span className="material-symbols-outlined text-[#1db576] text-3xl mb-3">verified</span>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Assinaturas Ativas</p>
            <p className="text-3xl font-black text-[#1db576]">{totalSales}</p>
          </div>
        </motion.div>

      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border flex-1"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground">Indicações Recentes</h3>
          <span className="text-xs text-muted-foreground font-medium">{recentSignups.length} registros</span>
        </div>

        {recentSignups.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">group_off</span>
            </div>
            <p className="font-bold text-foreground">Nenhuma indicação ainda</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Compartilhe seu link para começar a ver seus indicados aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSignups.map(s => {
              const isActive = s.plan_status === 'active'
              return (
                <div key={s.id} className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-inner">
                      {(s.name || s.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {s.name || s.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm ${
                    isActive 
                      ? 'bg-[#1db576]/10 text-[#1db576] border border-[#1db576]/20' 
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {isActive ? 'Ativo' : 'Pendente'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

    </main>
  )
}
