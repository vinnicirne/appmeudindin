import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') redirect('/')

  const displayName = userData?.name || user.email?.split('@')[0] || 'Admin'
  const email = user.email || ''

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="print:hidden"><AdminSidebar displayName={displayName} email={email} /></div>
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto print:overflow-visible print:h-auto print:block">
        {children}
      </main>
    </div>
  )
}

