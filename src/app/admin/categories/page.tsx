import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import CategoriesClient from './CategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') redirect('/')

  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true })

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Gerenciar Categorias</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Crie ou edite as categorias globais usadas em Lançamentos e Metas.
        </p>
      </div>
      <CategoriesClient initialCategories={categories || []} />
    </div>
  )
}
