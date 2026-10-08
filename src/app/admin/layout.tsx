import { requireAdmin } from '@/utils/admin'
import AdminSidebar from './AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
