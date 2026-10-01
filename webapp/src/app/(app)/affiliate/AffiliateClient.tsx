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
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://meudindinapp.vercel.app'

export default function AffiliateClient({ name, code, totalSignups, totalSales, recentSignups }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  const links = [
    {
      id: 'landing',
      label: 'Landing Page',
      description: 'Para atrair novos visitantes',
      icon: 'public',
      url: `${APP_URL}/?ref=${code}`,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'cadastro',
      label: 'Cadastro Direto',
      description: 'Leva direto para criar conta',
      icon: 'person_add',
      url: `${APP_URL}/cadastro?ref=${code}`,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'app',
      label: 'Link do App',
      description: 'Para quem já tem conta',
      icon: 'open_in_app',
      url: `${APP_URL}/login?ref=${code}`,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
    },
  ]

  function handleCopy(id: string, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(null), 2500)
    }).catch(() => {
      toast.error('Não foi possível copiar. Copie manualmente.')
    })
  }

  function handleShareWhatsApp(url: string) {
    const text = encodeURIComponent(`Controle suas finanças com o Meu DinDin! Acesse pelo meu link: ${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const conversionRate = totalSignups > 0 ? ((totalSales / totalSignups) * 100).toFixed(1) : '0.0'

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">

      {/* Saudação */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Olá, {name.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seu código de parceiro: <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{code}</span>
        </p>
      </motion.div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cadastros', value: totalSignups, icon: 'people', color: 'text-blue-600' },
          { label: 'Assinaturas', value: totalSales, icon: 'verified', color: 'text-emerald-600' },
          { label: 'Conversão', value: `${conversionRate}%`, icon: 'trending_up', color: 'text-purple-600' },
        ].map((m) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/60 text-center flex flex-col items-center gap-1"
          >
            <span className={`material-symbols-outlined text-2xl ${m.color}`}>{m.icon}</span>
            <p className="text-2xl font-black text-foreground">{m.value}</p>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Links de Indicação */}
      <div>
        <h2 className="text-base font-extrabold text-foreground mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-primary">link</span>
          Seus Links de Indicação
        </h2>

        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-card rounded-2xl p-4 shadow-sm border flex flex-col gap-3 ${link.color.split(' ').filter(c => c.startsWith('border')).join(' ')}`}
            >
              {/* Topo */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                    <span className="material-symbols-outlined text-xl">{link.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              </div>

              {/* URL */}
              <div className="bg-muted/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-mono text-muted-foreground truncate flex-1">{link.url}</span>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(link.id, link.url)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    copied === link.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {copied === link.id ? 'check_circle' : 'content_copy'}
                  </span>
                  {copied === link.id ? 'Copiado!' : 'Copiar Link'}
                </button>

                <button
                  onClick={() => handleShareWhatsApp(link.url)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] transition-colors"
                  title="Compartilhar no WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.529 5.845L.065 23.604a.75.75 0 0 0 .932.932l5.759-1.464A11.951 11.951 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.695-.527-5.222-1.44l-.374-.222-3.876.985.984-3.876-.222-.374A9.943 9.943 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Últimos Indicados */}
      <div>
        <h2 className="text-base font-extrabold text-foreground mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-primary">group_add</span>
          Últimos Indicados
        </h2>

        {recentSignups.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-muted-foreground">person_search</span>
            <p className="text-sm font-bold text-muted-foreground">Nenhum cadastro ainda</p>
            <p className="text-xs text-muted-foreground">Compartilhe seu link e acompanhe os indicados aqui!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSignups.map((s) => (
              <div
                key={s.id}
                className="bg-card rounded-2xl px-4 py-3 border border-border/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{s.name || s.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  s.plan_status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {s.plan_status === 'active' ? 'Assinante' : 'Cadastrado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé de suporte */}
      <div className="bg-card rounded-2xl p-5 border border-border/60 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366] flex-shrink-0">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Precisa de ajuda?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nossa equipe está disponível para te ajudar com dúvidas, materiais de divulgação ou qualquer outra necessidade.
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=5500000000000&text=Oi!%20Sou%20parceiro%20Meu%20DinDin%20e%20preciso%20de%20ajuda."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#25D366] hover:underline"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Falar com a equipe
          </a>
        </div>
      </div>

    </main>
  )
}
