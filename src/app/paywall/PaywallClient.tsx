'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface PaywallClientProps {
  userId: string
  userEmail: string
  userName: string
}

type PaymentMethod = 'pix' | 'card'
type PixState = 'form' | 'generating' | 'waiting' | 'approved' | 'error'

export default function PaywallClient({ userId, userEmail, userName }: PaywallClientProps) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [cpf, setCpf] = useState('')
  const [pixState, setPixState] = useState<PixState>('form')
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [qrCodeText, setQrCodeText] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [cardLoading, setCardLoading] = useState(false)

  // Formata o CPF (000.000.000-00)
  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = raw
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`
    }
    setCpf(formatted)
  }

  // Gera o Pix Transparente
  async function handleGeneratePix(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      setErrorMsg('Por favor, informe um CPF válido com 11 dígitos.')
      return
    }

    setPixState('generating')
    try {
      const res = await fetch('/api/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cleanCpf,
          userName: userName || 'Cliente',
          userEmail: userEmail || 'contato@meudindin.app',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível gerar o QR Code Pix.')
        setPixState('form')
        return
      }

      setPaymentId(String(data.paymentId))
      setQrCodeBase64(data.qrCodeBase64)
      setQrCodeText(data.qrCode)
      setPixState('waiting')
    } catch {
      setErrorMsg('Falha de conexão ao gerar o Pix. Tente novamente.')
      setPixState('form')
    }
  }

  // Polling para verificar se o Pix foi pago
  useEffect(() => {
    if (pixState !== 'waiting' || !paymentId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        })
        const data = await res.json()
        if (data.status === 'approved' || data.success) {
          setPixState('approved')
          clearInterval(interval)
          setTimeout(() => {
            router.replace('/')
          }, 2000)
        }
      } catch (err) {
        console.warn('Erro ao verificar status do Pix:', err)
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [pixState, paymentId, router])

  // Copiar código Pix Copia e Cola
  function handleCopy() {
    if (!qrCodeText) return
    navigator.clipboard.writeText(qrCodeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Checkout no cartão de crédito (Checkout Pro)
  async function handleCardCheckout() {
    setCardLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, userName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível gerar o link de pagamento do cartão.')
        setCardLoading(false)
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setErrorMsg('Falha de conexão. Tente novamente.')
      setCardLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl text-primary">workspace_premium</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Assinatura Meu DinDin</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Acesso ilimitado a todas as ferramentas por 1 ano.
          </p>
        </div>

        {/* Card de Preço */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Plano Anual</span>
            <p className="text-xs text-muted-foreground">Menos de R$ 2,50/mês</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-foreground">R$ 29,00</span>
            <span className="text-xs text-muted-foreground block">/ano</span>
          </div>
        </div>

        {/* Seletor de Método de Pagamento */}
        {pixState !== 'waiting' && pixState !== 'approved' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMethod('pix')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                method === 'pix'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-base text-[#1db576]">qr_code_2</span>
              <span>Pix Instantâneo</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                method === 'card'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined text-base text-primary">credit_card</span>
              <span>Cartão de Crédito</span>
            </button>
          </div>
        )}

        {/* MENSAGEM DE ERRO */}
        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FLUXO PIX - ESTADO FORMULÁRIO */}
        {method === 'pix' && pixState === 'form' && (
          <form onSubmit={handleGeneratePix} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cpf" className="text-xs font-bold text-foreground/80">
                CPF do Pagador (Exigido pelo Banco Central para emissão do Pix)
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                required
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-medium text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              Gerar QR Code Pix (R$ 29,00)
            </button>
          </form>
        )}

        {/* FLUXO PIX - GERANDO */}
        {method === 'pix' && pixState === 'generating' && (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-semibold text-foreground">Gerando seu Pix no Mercado Pago...</p>
          </div>
        )}

        {/* FLUXO PIX - AGUARDANDO PAGAMENTO */}
        {pixState === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="bg-white p-3 rounded-2xl border-2 border-border shadow-md">
              {qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-muted-foreground text-xs">
                  QR Code indisponível
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span>Aguardando seu pagamento no app do banco...</span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Código Pix Copiado! 🎉' : 'Copiar Código Pix (Copia e Cola)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPixState('form')}
                className="text-xs text-muted-foreground hover:text-foreground font-medium py-1"
              >
                Voltar / Trocar CPF
              </button>
            </div>
          </motion.div>
        )}

        {/* FLUXO PIX - APROVADO */}
        {pixState === 'approved' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#1db576]/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#1db576]">check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Pix Confirmado! 🎉</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Seu plano anual foi ativado. Redirecionando...
              </p>
            </div>
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </motion.div>
        )}

        {/* FLUXO CARTÃO DE CRÉDITO */}
        {method === 'card' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você será direcionado para o ambiente seguro do Mercado Pago para efetuar o pagamento via Cartão de Crédito.
            </p>
            <button
              type="button"
              onClick={handleCardCheckout}
              disabled={cardLoading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {cardLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando link...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">credit_card</span>
                  <span>Pagar com Cartão</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-border text-muted-foreground">
          <span className="material-symbols-outlined text-sm text-[#1db576]">lock</span>
          <span className="text-[11px] font-medium">Pagamento processado com segurança via Mercado Pago</span>
        </div>
      </motion.div>
    </main>
  )
}
