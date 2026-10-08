'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function AdminPushClient() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()

    const t = title.trim()
    const b = body.trim()

    if (!t || !b) {
      toast.error('Preencha título e mensagem.')
      return
    }
    if (t.length > 100) {
      toast.error('Título deve ter no máximo 100 caracteres.')
      return
    }
    if (b.length > 500) {
      toast.error('Mensagem deve ter no máximo 500 caracteres.')
      return
    }

    const ok = window.confirm(
      `Enviar notificação para TODOS os dispositivos?\n\n"${t}"\n${b}`
    )
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, body: b }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        toast.error(data.error || `Falha ao enviar (${res.status})`)
        return
      }

      const fails = data.failCount ? ` (${data.failCount} falha(s))` : ''
      toast.success(`Enviado para ${data.sentCount ?? 0} dispositivo(s)${fails}`)
      setTitle('')
      setBody('')
    } catch {
      toast.error('Erro de rede ao enviar notificação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-black text-foreground mb-2">
        Disparo de Notificações (Push)
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        A mensagem será enviada para todos os dispositivos com push ativo. Use com cuidado.
      </p>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div>
            <label htmlFor="push-title" className="text-sm font-bold text-foreground mb-2 block">
              Título
            </label>
            <input
              id="push-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Ex: Atualização no Meu DinDin!"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label htmlFor="push-body" className="text-sm font-bold text-foreground mb-2 block">
              Mensagem
            </label>
            <textarea
              id="push-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={500}
              placeholder="Ex: Confira as novas funcionalidades..."
              rows={4}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Preview simples */}
          {(title.trim() || body.trim()) && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Preview</p>
              <p className="font-bold text-sm text-foreground">{title.trim() || 'Título'}</p>
              <p className="text-xs text-muted-foreground mt-1">{body.trim() || 'Mensagem'}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined">
              {loading ? 'hourglass_empty' : 'send'}
            </span>
            {loading ? 'Disparando...' : 'Enviar para Todos'}
          </button>
        </form>
      </div>
    </div>
  )
}
