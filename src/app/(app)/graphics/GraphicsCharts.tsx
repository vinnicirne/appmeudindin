'use client'

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border shadow-md rounded-xl p-3 text-sm z-50">
        <p className="font-bold text-foreground mb-1">{data.label}</p>
        <p className="font-bold" style={{ color: data.hex }}>{formatCurrency(data.amount)}</p>
        <p className="text-muted-foreground text-xs mt-1">{data.percentage.toFixed(1)}% do total no mês</p>
      </div>
    )
  }
  return null
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-md rounded-xl p-3 text-sm z-50">
        <p className="font-bold text-foreground mb-2">{label}</p>
        <p className="text-[#1db576] font-medium">Receitas: {formatCurrency(payload[0]?.value || 0)}</p>
        <p className="text-[#e74c4c] font-medium">Despesas: {formatCurrency(payload[1]?.value || 0)}</p>
      </div>
    )
  }
  return null
}

interface Props {
  categoryExpenses: any[]
  sixMonthsHistory: any[]
  showOnlyBar?: boolean
}

export default function GraphicsCharts({ categoryExpenses, sixMonthsHistory, showOnlyBar = false }: Props) {
  if (showOnlyBar) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sixMonthsHistory} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
          />
          <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
          <Bar dataKey="income" fill="#1db576" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="expense" fill="#e74c4c" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gráfico de Rosca */}
      <div className="h-48 w-full flex items-center justify-center overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryExpenses}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {categoryExpenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.hex} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista das categorias */}
      <div className="space-y-2.5 pt-2">
        {categoryExpenses.map(cat => (
          <div key={cat.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div 
                style={{ backgroundColor: cat.hex }} 
                className="w-3 h-3 rounded-full flex-shrink-0" 
              />
              <span className="font-medium text-foreground">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="font-bold text-foreground">{formatCurrency(cat.amount)}</span>
              <span className="text-[10px] text-muted-foreground font-semibold w-10 text-right">
                {cat.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
