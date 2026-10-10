export interface PlanItem {
  id: string
  name: string
  description: string | null
  price: number
  interval: 'month' | 'year'
  features: string[]
  is_active: boolean
  badge: string | null
  sort_order: number
  created_at?: string
}

export const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'meu_dindin_anual',
    name: 'Plano Anual Oficial',
    description: 'Acesso completo ao Meu DinDin por 12 meses com economia máxima.',
    price: 37.00,
    interval: 'year',
    features: [
      'Controle financeiro completo',
      'Relatórios e gráficos ilimitados',
      'Categorias e orçamentos personalizados',
      'Importação e exportação de dados',
      'Suporte prioritário via WhatsApp'
    ],
    is_active: true,
    badge: 'MAIS POPULAR',
    sort_order: 1
  },
  {
    id: 'meu_dindin_mensal',
    name: 'Plano Mensal',
    description: 'Flexibilidade total mês a mês, sem fidelidade.',
    price: 9.90,
    interval: 'month',
    features: [
      'Controle financeiro básico',
      'Lançamentos diários',
      'Resumo mensal simples'
    ],
    is_active: true,
    badge: null,
    sort_order: 2
  }
]
