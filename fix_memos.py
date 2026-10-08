import re
with open('src/app/(app)/HomeClient.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

new_memo = '''
  const { filteredTransactions, income, expense, paidCount, pendingCount } = useMemo(() => {
    let inc = 0
    let exp = 0
    let pd = 0
    let pnd = 0
    const list = []

    for (const t of transactions) {
      const parts = parseDateParts(t.date)
      if (!parts) continue
      if (parts.year === year && parts.month === month) {
        list.push(t)
        const val = Number(t.amount || 0)
        if (t.type === 'INCOME') inc += val
        else exp += val
        
        if (t.is_paid === true) pd += 1
        else pnd += 1
      }
    }

    list.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))

    return { filteredTransactions: list, income: inc, expense: exp, paidCount: pd, pendingCount: pnd }
  }, [transactions, year, month])
'''

text = re.sub(r'const filtered = useMemo\(\(\) =>.*?const pendingCount = filteredTransactions\.length - paidCount', new_memo, text, flags=re.DOTALL)

# Also fix the usage of totalIncome and totalExpense which are now just income and expense
text = text.replace('totalIncome', 'income')
text = text.replace('totalExpense', 'expense')
text = text.replace('filteredTransactions.map', 'filteredTransactions.map')

with open('src/app/(app)/HomeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
