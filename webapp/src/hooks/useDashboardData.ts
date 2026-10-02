import { useQuery } from '@tanstack/react-query'
import { getDashboardData } from '@/app/actions/queries'

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const data = await getDashboardData()
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
