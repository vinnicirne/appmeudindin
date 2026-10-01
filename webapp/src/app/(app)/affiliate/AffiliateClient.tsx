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
      label: 'Página Inicial / Landing Page',
      description: 'Ideal para posts, bio do Instagram e vídeos explicativos.',
      icon: 'public',
      url: `${APP_URL}/?ref=${code}`,
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      borderClass: 'hover:border-blue-500/40',
    },
    {
      id: 'cadastro',
      label: 'Link de Cadastro Direto',
      description: 'Leva o usuário direto para criar conta e assinar.',
      icon: 'person_add',
      url: `${APP_URL}/cadastro?ref=${code}`,
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      borderClass: 'hover:border-emerald-500/40',
    },
    {
      id: 'app',
      label: 'Acesso Direto ao App',
      description: 'Direciona direto para a tela de login do aplicativo.',
      icon: 'smartphone',
      url: `${APP_URL}/login?ref=${code}`,
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      borderClass: 'hover:border-purple-500/40',
    },
  ]

  function handleCopy(id: string, url: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(id)
        toast.success('Link copiado para a área de transferência!')
        setTimeout(() => setCopied(null), 2500)
      }).catch(() => {
        fallbackCopy(id, url)
      })
    } else {
      fallbackCopy(id, url)
    }
  }

  function fallbackCopy(id: string, url: string) {
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      setCopied(id)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(null), 2500)
    } catch (err) {
      toast.error('Não foi possível copiar automaticamente.')
    }
    document.body.removeChild(textArea)
  }

  function handleShareWhatsApp(url: string, label: string) {
    const text = encodeURIComponent(`Organize suas finanças de forma simples com o Meu DinDin! Acesse pelo meu link: ${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const conversionRate = totalSignups > 0 ? ((totalSales / totalSignups) * 100).toFixed(1) : '0.0'

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">

      {/* Saudação e Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-3xl p-6 border border-border/60 shadow-sm"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Área do Parceiro
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Olá, <strong className="text-foreground">{name.split(' ')[0]}</strong>! Divulgue seus links e acompanhe seus resultados.
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 flex items-center justify-between sm:justify-start gap-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Seu Código</p>
            <p className="font-mono font-black text-lg text-primary">{code}</p>
          </div>
          <button
            onClick={() => handleCopy('code', code)}
            className="w-8 h-8 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-colors"
            title="Copiar Código"
          >
            <span className="material-symbols-outlined text-base">
              {copied === 'code' ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Cadastros Realizados', value: totalSignups, icon: 'group', color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Assinaturas Ativas', value: totalSales, icon: 'verified', color: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: 'trending_up', color: 'text-purple-600 bg-purple-500/10' },
        ].map((m) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl p-5 shadow-sm border border-border/60 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.color} shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{m.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{m.value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Links de Divulgação */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-primary">share</span>
            Seus Links Exclusivos de Divulgação
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Toque para copiar</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {links.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-3xl p-5 shadow-sm border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${link.borderClass}`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${link.iconBg}`}>
                  <span className="material-symbols-outlined text-2xl">{link.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground">{link.label}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2 sm:mb-1">{link.description}</p>
                  <div className="bg-muted/60 border border-border/50 rounded-xl px-3 py-1.5 font-mono text-xs text-foreground/80 truncate max-w-md">
                    {link.url}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(link.id, link.url)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    copied === link.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {copied === link.id ? 'check_circle' : 'content_copy'}
                  </span>
                  <span>{copied === link.id ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(link.url, link.label)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] transition-colors shrink-0"
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

      {/* Lista dos Últimos Indicados */}
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-foreground mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-primary">group_add</span>
          Últimos Usuários Indicados
        </h2>

        {recentSignups.length === 0 ? (
          <div className="bg-card rounded-3xl p-8 border border-dashed border-border text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">person_search</span>
            </div>
            <div className="max-w-sm">
              <p className="text-sm font-bold text-foreground">Nenhum cadastro registrado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Compartilhe seus links nas redes sociais e acompanhe cada novo cadastro aqui em tempo real!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentSignups.map((s) => (
              <div
                key={s.id}
                className="bg-card rounded-2xl p-3.5 border border-border/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {(s.name || s.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{s.name || s.email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
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

      {/* Card de Ajuda e Suporte */}
      <div className="bg-card rounded-3xl p-5 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Dúvidas sobre o Programa de Parceiros?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fale diretamente com nosso time para tirar dúvidas ou solicitar materiais de divulgação.
            </p>
          </div>
        </div>

        <a
          href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1!%20Sou%20parceiro%20do%20Meu%20DinDin%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-colors shrink-0 w-full sm:w-auto shadow-sm"
        >
          <span className="material-symbols-outlined text-base">chat</span>
          <span>Suporte via WhatsApp</span>
        </a>
      </div>

    </main>
  )
}
