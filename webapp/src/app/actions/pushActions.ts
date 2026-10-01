'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function saveFcmToken(token: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autenticado' }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await adminSupabase
      .from('users')
      .update({ fcm_token: token, push_enabled: true })
      .eq('id', user.id)

    if (error) {
      console.warn('Erro ao salvar FCM Token no Supabase:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
