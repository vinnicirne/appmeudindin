'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  category_id: string
  is_paid?: boolean
}

const categoryLabel: Record<string, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  salario: 'Salário',
  lazer: 'Lazer',
  saude: 'Saúde & Farmácia',
  outros: 'Outros',
}

interface Props {
  transactions: Transaction[]
}

export default function ReportsClient({ transactions }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

  const filteredTransactions = transactions.filter(t => {
    let keep = true
    if (startDate && t.date < startDate) keep = false
    if (endDate && t.date > endDate) keep = false
    if (typeFilter !== 'ALL' && t.type !== typeFilter) keep = false
    return keep
  })

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0)
  const balance = totalIncome - totalExpense

  function generatePDF() {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Relatório Financeiro', 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}`, 14, 30)
    
    doc.text(`Total Entradas: R$ ${totalIncome.toFixed(2)}`, 14, 38)
    doc.text(`Total Saídas: R$ ${totalExpense.toFixed(2)}`, 14, 44)
    doc.text(`Saldo do Período: R$ ${balance.toFixed(2)}`, 14, 50)

    const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Status", "Valor (R$)"]
    const tableRows = []

    filteredTransactions.forEach(t => {
      const row = [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        categoryLabel[t.category_id] || t.category_id,
        t.type === 'INCOME' ? 'Entrada' : 'Saída',
        t.is_paid ? 'Pago' : 'Pendente',
        t.amount.toFixed(2)
      ]
      tableRows.push(row)
    })

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 181, 118] }
    })

    doc.save(`relatorio_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="p-4 sm:p-6 pb-32 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gere relatórios por período e exporte em PDF</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={filteredTransactions.length === 0}
          className="bg-primary text-primary-foreground font-bold py-2.5 px-5 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
          Baixar PDF
        </button>
      </header>

      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-foreground block mb-2">Data Inicial</label>
          <input 
            type="date" 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-foreground block mb-2">Data Final</label>
          <input 
            type="date" 
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-foreground block mb-2">Tipo</label>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="ALL">Todos os Registros</option>
            <option value="INCOME">Apenas Entradas</option>
            <option value="EXPENSE">Apenas Saídas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Entradas</p>
          <p className="text-xl font-black text-emerald-500">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Saídas</p>
          <p className="text-xl font-black text-rose-500">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Saldo do Período</p>
          <p className={`text-xl font-black ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-bold text-foreground">Resultados ({filteredTransactions.length})</h2>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
            <p>Nenhuma transação encontrada para este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoryLabel[t.category_id] || t.category_id}
                    </td>
                    <td className="px-4 py-3">
                      {t.is_paid ? (
                         <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg">Pago</span>
                      ) : (
                         <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg">Pendente</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
