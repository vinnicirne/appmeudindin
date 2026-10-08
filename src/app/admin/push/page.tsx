import AdminPushClient from './AdminPushClient'
import { requireAdmin } from '@/utils/admin'

export default async function Page() {
  await requireAdmin()
  return <AdminPushClient />
}
