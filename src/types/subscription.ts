export interface SubscriptionItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  amount: number
  status: 'active' | 'pending' | 'canceled' | 'expired'
  interval: 'year' | 'month'
  createdAt: string
  expiresAt: string | null
}
