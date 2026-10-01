"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/actions/categoryActions'

export default function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ id: '', label: '', icon: 'category', color: 'gray-500' })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleEdit = (cat: any) => {
    setEditingId(cat.id)
    setFormData({ id: cat.id, label: cat.label, icon: cat.icon, color: cat.color })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ id: '', label: '', icon: 'category', color: 'gray-500' })
    setErrorMsg('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    let res
    if (editingId) {
      res = await updateCategoryAction(editingId, { label: formData.label, icon: formData.icon, color: formData.color })
    } else {
      const slug = formData.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, '-')
      res = await createCategoryAction({ id: slug, label: formData.label, icon: formData.icon, color: formData.color })
    }

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      window.location.reload()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return
    const res = await deleteCategoryAction(id)
    if (res?.error) {
      alert(res.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card shadow-sm p-4">
        <h2 className="text-lg font-bold mb-4">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-bold">Nome da Categoria</label>
            <input required type="text" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full text-sm px-3 py-2 border border-border/60 rounded-xl bg-background" placeholder="Ex: Pet Shop" />
          </div>
          <div className="w-full sm:w-32 space-y-1">
            <label className="text-xs font-bold">Ícone (Material)</label>
            <input required type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full text-sm px-3 py-2 border border-border/60 rounded-xl bg-background" placeholder="Ex: pets" />
          </div>
          <div className="w-full sm:w-32 space-y-1">
            <label className="text-xs font-bold">Cor (Tailwind)</label>
            <input required type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full text-sm px-3 py-2 border border-border/60 rounded-xl bg-background" placeholder="Ex: amber-500" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingId && (
              <button type="button" onClick={handleCancel} className="px-4 py-2 text-xs font-bold bg-muted text-muted-foreground rounded-xl w-full sm:w-auto">Cancelar</button>
            )}
            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl w-full sm:w-auto">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
        {errorMsg && <p className="text-red-500 text-xs mt-2 font-bold">{errorMsg}</p>}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${cat.color}/10 text-${cat.color}`} style={cat.color.startsWith('#') ? { backgroundColor: `${cat.color}20`, color: cat.color } : {}}>
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold">{cat.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{cat.id}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleEdit(cat)} className="text-xs text-blue-500 font-bold hover:underline">Editar</button>
              <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 font-bold hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
