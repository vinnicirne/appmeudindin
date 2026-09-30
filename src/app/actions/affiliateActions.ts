'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') throw new Error('Acesso não autorizado.')
  return supabase
}

export async function createAffiliateAction(formData: {
  name: string
  code: string
  commissionType: 'fixed' | 'percentage'
  commissionValue: number
  pixKey: string
}) {
  try {
    const supabase = await checkAdmin()
    
    // Como somos admin, usamos a service role via edge function ou o usuário admin tem permissão no RLS
    // Se a policy permite service_role, devemos usar a adminSupabase se houver problema, mas por agora 
    // tentaremos usar o cliente logado se o RLS permitir (a policy que eu fiz tem service_role, então vou
    // usar a adminSupabase para evitar falhas)
    
    // Import do admin
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const adminSupabase = createAdmin(url, key, { auth: { persistSession: false } })

    const { error } = await adminSupabase
      .from('affiliates')
      .insert({
        name: formData.name,
        code: formData.code,
        commission_type: formData.commissionType,
        commission_value: formData.commissionValue,
        pix_key: formData.pixKey
      })

    if (error) throw error

    revalidatePath('/admin/affiliates')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar afiliado.' }
  }
}

export async function deleteAffiliateAction(id: string) {
  try {
    await checkAdmin()
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const adminSupabase = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
      process.env.SUPABASE_SERVICE_ROLE_KEY || '', 
      { auth: { persistSession: false } }
    )

    const { error } = await adminSupabase
      .from('affiliates')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/affiliates')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao deletar afiliado.' }
  }
}
