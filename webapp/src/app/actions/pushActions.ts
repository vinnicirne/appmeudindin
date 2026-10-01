'use server'

import { createClient } from '@/utils/supabase/server'

export async function saveFcmToken(token: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
      .from('users')
      .update({ fcm_token: token, push_enabled: true })
      .eq('id', user.id)

    if (error) {
      // If the column doesn't exist yet, we catch and ignore to not break the app
      console.warn('Erro ao salvar FCM Token (provavelmente a coluna não existe):', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}