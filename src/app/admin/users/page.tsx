import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { AdminUsersClient, AdminUserItem } from './AdminUsersClient'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const adminClient = (serviceKey && supabaseUrl)
    ? createSupabaseClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : supabase

  const { data: usersData, error } = await adminClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: affiliatesData } = await adminClient
    .from('affiliates')
    .select('*')

  if (error) {
    console.error('[AdminUsersPage] Erro ao buscar usuários:', error)
  }

  const affiliatesList = affiliatesData || []

  const users: AdminUserItem[] = (usersData || []).map((u: any) => {
    // Busca se existe registro de afiliado vinculado por user_id, affiliate_code ou email
    const matchingAff = affiliatesList.find(a => 
      a.user_id === u.id || 
      (u.affiliate_code && a.code === u.affiliate_code) ||
      (a.name && u.name && a.name.toLowerCase() === u.name.toLowerCase())
    )

    const isAffiliate = Boolean(u.is_affiliate || matchingAff)
    const affiliateCode = u.affiliate_code || matchingAff?.code || null

    return {
      id: u.id,
      name: u.name || null,
      email: u.email || null,
      phone: u.phone || null,
      role: u.role || 'user',
      plan_status: u.plan_status || 'pending',
      trial_ends_at: u.trial_ends_at || null,
      created_at: u.created_at || new Date().toISOString(),
      is_affiliate: isAffiliate,
      affiliate_code: affiliateCode,
      affiliate_data: matchingAff ? {
        id: matchingAff.id,
        code: matchingAff.code,
        commission_type: matchingAff.commission_type || 'percentage',
        commission_value: Number(matchingAff.commission_value || 30),
        pix_key: matchingAff.pix_key || '',
        instagram: matchingAff.instagram || '',
        phone: matchingAff.phone || u.phone || '',
      } : undefined
    }
  })

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Gerenciar Usuários
          </h1>
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {users.length} cadastrados
          </span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Visualize, filtre, ative planos manualmente ou altere privilégios de acesso dos usuários.
        </p>
      </div>

      <AdminUsersClient users={users} currentUserId={user.id} />
    </div>
  )
}
