'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function CadastroPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')

  // Formata o telefone / WhatsApp (00) 00000-0000
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = raw
    if (raw.length > 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
    } else if (raw.length > 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
    } else if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    }
    setPhone(formatted)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')
    setFormState('loading')

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          phone: phone.replace(/\D/g, ''),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao criar conta. Tente novamente.')
        setFormState('error')
        return
      }

      setFormState('success')

      // Redireciona para o paywall no app
      router.push('/paywall')

    } catch {
      setErrorMsg('Falha de conexão. Verifique sua internet e tente novamente.')
      setFormState('error')
    }
  }

  const isLoading = formState === 'loading' || formState === 'success'

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background decorator */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm my-auto flex flex-col items-center"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6 gap-2 text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg shadow-primary/30">
            $
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Crie sua conta</h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center">
            Preencha os dados abaixo e em seguida você será levado ao pagamento.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-card p-6 sm:p-8 rounded-[2rem] shadow-xl border border-border">
          {/* Progresso do funil */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">1</div>
              <span className="text-xs font-semibold text-primary">Cadastro</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">2</div>
              <span className="text-xs font-medium text-muted-foreground">Pagamento</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">3</div>
              <span className="text-xs font-medium text-muted-foreground">Acesso</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nome */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-foreground/80">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="João Silva"
                disabled={isLoading}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-60"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground/80">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                disabled={isLoading}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-60"
              />
            </div>

            {/* WhatsApp / Telefone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground/80">
                WhatsApp / Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                required
                placeholder="(00) 00000-0000"
                disabled={isLoading}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-60"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-foreground/80">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pr-12 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Erro */}
            {formState === 'error' && errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <p>{errorMsg}</p>
              </motion.div>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:pointer-events-none shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{formState === 'success' ? 'Redirecionando...' : 'Criando conta...'}</span>
                </>
              ) : (
                <>
                  <span>Continuar para o Pagamento</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground text-xs">
          <span className="material-symbols-outlined text-sm text-[#1db576]">lock</span>
          <p className="font-medium">Pagamento 100% seguro via Mercado Pago</p>
        </div>

        {/* Link para login */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Fazer login
          </Link>
        </p>
      </motion.div>
    </main>
  )
}

