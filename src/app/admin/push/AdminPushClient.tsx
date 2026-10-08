'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function AdminPushClient() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !body) {
      return toast.error('Preencha título e mensagem.')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Enviado para ${data.sentCount} dispositivos!`)
        setTitle('')
        setBody('')
      } else {
        toast.error('Erro: ' + data.error)
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-black text-foreground mb-6">Disparo de Notificações (Push)</h1>
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">Título da Notificação</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Atualização no Meu DinDin!"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">Mensagem</label>
            <textarea 
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Ex: Confira as novas funcionalidades..."
              rows={4}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'send'}</span>
            {loading ? 'Disparando...' : 'Enviar para Todos'}
          </button>
        </form>
      </div>
    </div>
  )
}
