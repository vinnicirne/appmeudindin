'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const adminClient = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 2)

  // Dispara todas as consultas em paralelo para máxima velocidade
  const [txRes, catRes, goalRes, balRes] = await Promise.all([
    adminClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', oneYearAgo.toISOString())
      .limit(2000)
      .order('date', { ascending: false }),
      
    adminClient
      .from('categories')
      .select('*')
      .eq('is_active', true),

    adminClient
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    adminClient
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .eq('is_paid', true)
  ])

  const transactions = txRes.data || []
  const categories = catRes.data || []
  const goals = goalRes.data || []
  const allTxForBalance = balRes.data || []

  const overallBalance = allTxForBalance.reduce((sum, t) => {
    return t.type === 'INCOME' ? sum + t.amount : sum - t.amount
  }, 0)

  return {
    transactions,
    categories,
    goals,
    overallBalance
  }
}
