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

  const [txRes, catRes, goalRes, balRes, vaultRes, vaultTxRes] = await Promise.all([
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
      .eq('is_paid', true),
      
    adminClient
      .from('vaults')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),

    adminClient
      .from('vault_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
  ])

  const transactions = txRes.data || []
  const categories = catRes.data || []
  const goals = goalRes.data || []
  const vaults = vaultRes.data || []
  const vaultTransactions = vaultTxRes.data || []
  const allTxForBalance = balRes.data || []

  const overallBalance = allTxForBalance.reduce((sum, t) => {
    return t.type === 'INCOME' ? sum + Number(t.amount) : sum - Number(t.amount)
  }, 0)

  // Calculate vault balance mathematically
  const vaultsWithBalance = vaults.map((vault: any) => {
    const vTxs = vaultTransactions.filter((vt: any) => vt.vault_id === vault.id)
    const balance = vTxs.reduce((sum: number, tx: any) => {
      if (tx.type === 'DEPOSIT' || tx.type === 'YIELD') return sum + Number(tx.amount)
      if (tx.type === 'WITHDRAWAL') return sum - Number(tx.amount)
      return sum
    }, 0)
    return { ...vault, balance }
  })

  // Total balance locked in vaults
  const totalInVaults = vaultsWithBalance.reduce((sum: number, v: any) => sum + v.balance, 0)
  
  // Real liquid balance (overall - what is locked in vaults)
  const liquidBalance = overallBalance - totalInVaults

  return {
    transactions,
    categories,
    goals,
    vaults: vaultsWithBalance,
    vaultTransactions,
    overallBalance,
    totalInVaults,
    liquidBalance
  }
}
