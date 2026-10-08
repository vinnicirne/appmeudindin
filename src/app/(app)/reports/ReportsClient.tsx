'use client'

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useDashboardData } from '@/hooks/useDashboardData'
import { parseDateParts, formatDateBR, dateKey } from '@/lib/dateUtils'
import { buildCategoryMap, buildCategoryColorsMap } from '@/lib/categoryUtils'

export default function ReportsClient() {
  const { data, isLoading } = useDashboardData()
  const transactions = data?.transactions || []
  const dbCategories = data?.categories || []

  const today = new Date()
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  
  const categoryMap = useMemo(() => buildCategoryMap(dbCategories), [dbCategories])
  const categoryColorsMap = useMemo(() => buildCategoryColorsMap(dbCategories), [dbCategories])

  const { filteredTransactions, totalIncome, totalExpense, balance } = useMemo(() => {
    const list = transactions
      .filter(t => {
        const tDate = dateKey(t.date)
        if (startDate && tDate < startDate) return false
        if (endDate && tDate > endDate) return false
        if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
        return true
      })
      .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))

    let income = 0
    let expense = 0
    for (const t of list) {
      if (t.type === 'INCOME') income += Number(t.amount || 0)
      else expense += Number(t.amount || 0)
    }

    return { 
      filteredTransactions: list, 
      totalIncome: income, 
      totalExpense: expense, 
      balance: income - expense 
    }
  }, [transactions, startDate, endDate, typeFilter])

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function generatePDF() {
    if (filteredTransactions.length === 0) {
      toast.error('Não há transações nesse período para gerar o PDF.')
      return
    }

    const toastId = toast.loading('Gerando PDF...')
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

      doc.setFontSize(18)
      doc.text('Relatório Financeiro', 14, 20)
      
      doc.setFontSize(10)
      const periodo = `Período: ${startDate ? formatDateBR(startDate) : 'Início'} até ${endDate ? formatDateBR(endDate) : 'Hoje'}`
      doc.text(periodo, 14, 28)
      doc.text(`Entradas: R$ ${fmtMoney(totalIncome)}`, 14, 36)
      doc.text(`Saídas: R$ ${fmtMoney(totalExpense)}`, 14, 42)
      doc.text(`Saldo: R$ ${fmtMoney(balance)}`, 14, 48)

      const col = { data: 14, desc: 36, cat: 95, tipo: 130, status: 155, valor: pageWidth - 14 }
      let y = 60

      const drawHeader = () => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('Data', col.data, y)
        doc.text('Descrição', col.desc, y)
        doc.text('Categoria', col.cat, y)
        doc.text('Tipo', col.tipo, y)
        doc.text('Status', col.status, y)
        doc.text('Valor', col.valor, y, { align: 'right' })
        doc.setDrawColor(180)
        doc.line(14, y + 2, pageWidth - 14, y + 2)
        y += 8
        doc.setFont('helvetica', 'normal')
      }

      drawHeader()

      filteredTransactions.forEach(t => {
        if (y > 280) {
          doc.addPage()
          y = 20
          drawHeader()
        }
        
        const dateStr = formatDateBR(t.date)
        const descStr = t.description.length > 28 ? t.description.substring(0, 28) + '...' : t.description
        const catStr = (categoryMap[t.category_id] || t.category_id).substring(0, 18)
        const typeStr = t.type === 'INCOME' ? 'Entrada' : 'Saída'
        const statusStr = t.is_paid === true ? 'Pago' : 'Pendente'
        const valStr = `R$ ${fmtMoney(t.amount)}`

        doc.text(dateStr, col.data, y)
        doc.text(descStr, col.desc, y)
        doc.text(catStr, col.cat, y)
        doc.text(typeStr, col.tipo, y)
        doc.text(statusStr, col.status, y)
        doc.text(valStr, col.valor, y, { align: 'right' })
        
        y += 7
      })

      doc.save(`relatorio_${dateKey(new Date().toISOString())}.pdf`)
      toast.success('Download concluído!', { id: toastId })
    } catch (error: any) {
      console.error(error)
      toast.error('Falha ao gerar o PDF. ' + (error?.message || ''), { id: toastId })
    }
  }

  function exportCSV() {
    if (filteredTransactions.length === 0) {
      toast.error('Não há dados para exportar.')
      return
    }

    const headers = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor', 'Status']
    const rows = filteredTransactions.map(t => {
      const data = formatDateBR(t.date)
      const desc = `"${t.description.replace(/"/g, '""')}"`
      const cat = categoryMap[t.category_id] || t.category_id
      const type = t.type === 'INCOME' ? 'Receita' : 'Despesa'
      const val = t.amount.toString().replace('.', ',')
      const status = t.is_paid === true ? 'Pago/Recebido' : 'Pendente'
      return [data, desc, cat, type, val, status].join(';')
    })

    const csvContent = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `extrato_${dateKey(new Date().toISOString())}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Arquivo CSV gerado com sucesso!')
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full relative min-h-screen pb-24">

      <div className="flex items-center justify-between mb-6 mt-2 px-2">
        <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-border/50 mb-6 flex flex-col gap-4">
        
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Data Inicial</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">calendar_today</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Data Final</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">event</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Tipo de Lançamento</label>
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setTypeFilter('ALL')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${typeFilter === 'ALL' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setTypeFilter('INCOME')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${typeFilter === 'INCOME' ? 'bg-[#1db576] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Receitas
            </button>
            <button 
              onClick={() => setTypeFilter('EXPENSE')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${typeFilter === 'EXPENSE' ? 'bg-[#e74c4c] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Despesas
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button 
            onClick={generatePDF}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Baixar PDF
          </button>
          <button 
            onClick={exportCSV}
            className="flex-1 bg-card border border-border text-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-muted shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            Exportar CSV
          </button>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span> Entradas
          </p>
          <p className="text-sm font-bold text-[#1db576]">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span> Saídas
          </p>
          <p className="text-sm font-bold text-[#e74c4c]">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">account_balance_wallet</span> Saldo Líquido
          </p>
          <p className={`text-sm font-bold ${balance >= 0 ? 'text-[#1db576]' : 'text-[#e74c4c]'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Results Preview */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-sm font-bold text-foreground">Pré-visualização</h2>
        <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground">
          {filteredTransactions.length} registros
        </span>
      </div>

      <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm flex flex-col">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">search_off</span>
            </div>
            <p className="font-bold text-foreground text-sm">Nenhum resultado</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Altere os filtros acima para encontrar suas transações.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Data</th>
                  <th className="px-4 py-3 font-bold">Descrição</th>
                  <th className="px-4 py-3 font-bold">Categoria</th>
                  <th className="px-4 py-3 font-bold">Valor</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.map(t => {
                  const isPaid = t.is_paid === true
                  const isIncome = t.type === 'INCOME'
                  const catLabel = categoryMap[t.category_id] || t.category_id
                  
                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-muted-foreground">{formatDateBR(t.date)}</td>
                      <td className="px-4 py-3 font-bold text-foreground max-w-[150px] truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded-full text-[10px]">{catLabel}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${isIncome ? 'text-[#1db576]' : 'text-foreground'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? (isIncome ? 'bg-[#1db576]/10 text-[#1db576]' : 'bg-[#1db576]/10 text-[#1db576]') 
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {isPaid ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  )
}
