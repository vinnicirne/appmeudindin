import re

with open('original_homeclient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports = '''import { parseDateParts, formatDateBR, dateKey } from '@/lib/dateUtils'
import { buildCategoryMap, buildCategoryColorsMap } from '@/lib/categoryUtils'
import { useQueryClient } from '@tanstack/react-query'
'''
content = content.replace("import { buildCategoryLabelMap } from '@/lib/utils'", imports)

# 2. Vaults variables
vault_vars = '''  const overallBalance = data?.overallBalance || 0
  const liquidBalance = data?.liquidBalance || 0
  const totalInVaults = data?.totalInVaults || 0
'''
content = content.replace("  const overallBalance = data?.overallBalance || 0", vault_vars)

# 3. UseQueryClient
content = content.replace("const [year, setYear] = useState(today.getFullYear())", "const queryClient = useQueryClient()\n  const [year, setYear] = useState(today.getFullYear())")

# 4. Remove router
content = re.sub(r'const router = useRouter\(\)\n', '', content)

# 5. Memos mapping
memos = '''
  const categoryMap = useMemo(() => buildCategoryMap(dbCategories), [dbCategories])
  const categoryColorsMap = useMemo(() => buildCategoryColorsMap(dbCategories), [dbCategories])
'''
content = content.replace("const [isDeleting, setIsDeleting] = useState(false)", "const [isDeleting, setIsDeleting] = useState(false)\n" + memos)
content = content.replace("const [togglingId, setTogglingId] = useState<string | null>(null)", "const [togglingId, setTogglingId] = useState<string | null>(null)")
content = content.replace("const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)", "const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)")
content = content.replace("const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)", "const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)")

# 6. Unifying the useMemo for logic
old_memos = re.search(r'const filtered = useMemo\(\(\) => \{.*const pendingCount = pendingTrans\.length', content, re.DOTALL)
if old_memos:
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
    content = content[:old_memos.start()] + new_memo + content[old_memos.end():]

# Fix references to `filtered` which is now `filteredTransactions`
content = content.replace("filtered.map", "filteredTransactions.map")
content = content.replace("filtered.length", "filteredTransactions.length")

# Remove old router.refresh
content = content.replace("router.refresh()", "queryClient.invalidateQueries({ queryKey: ['dashboardData'] })")

# Update Delete
content = content.replace("await deleteTransactionAction(transactionToDelete)", "await deleteTransactionAction(transactionToDelete)\n    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })")

# Update Toggle
content = content.replace("const newStatus = t.is_paid === false ? true : false", "const newStatus = t.is_paid === true ? false : true")
content = content.replace("const res = await togglePaidTransactionAction(id, newStatus)", """
    queryClient.setQueryData(['dashboardData'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        transactions: old.transactions.map((tx: any) => 
          tx.id === t.id ? { ...tx, is_paid: newStatus } : tx
        )
      }
    })
    const res = await togglePaidTransactionAction(t.id, newStatus)
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
""")

# Let's fix the toggle function signature
content = content.replace("async function handleTogglePaid(id: string, t: Transaction) {", "async function handleTogglePaid(t: Transaction) {")
content = content.replace("setTogglingId(id)", "setTogglingId(t.id)")
content = content.replace("handleTogglePaid(t.id, t)", "handleTogglePaid(t)")

# Vaults balance injection
vault_html = '''
          <div className="flex flex-col gap-1 mb-3">
            <span className="text-white/80 text-xs font-semibold">Saldo Livre Disponível</span>
            <span className="text-3xl font-extrabold tracking-tight">{formatCurrency(liquidBalance)}</span>
          </div>
          <div className="mb-4">
            <div className="inline-flex bg-[#23735b] px-3 py-1 rounded-full items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-white/95">
                {paidCount} baixado(s) {pendingCount > 0 ? `· ${pendingCount} pendente(s)` : ''}
              </span>
              <span className="text-[11px] font-semibold text-white/95 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">savings</span> Guardado: {formatCurrency(totalInVaults)}
              </span>
            </div>
          </div>
'''
content = re.sub(r'<div className="flex flex-col gap-1 mb-3">.*?</div>\s*<div className="mb-4">.*?</div>', vault_html, content, flags=re.DOTALL)

# T.is_paid logic in table
content = content.replace("const isPaid = t.is_paid !== false", "const isPaid = t.is_paid === true")

# Replace getCategoryLabel logic
content = re.sub(r'const getCategoryLabel = \(id: string\) => \{.*?\}\n', '', content, flags=re.DOTALL)
content = content.replace("getCategoryLabel(t.category_id)", "categoryMap[t.category_id] || t.category_id")

# Replace date printing
content = re.sub(r"new Date\(t\.date\)\.toLocaleDateString\('pt-BR'\)", 'formatDateBR(t.date)', content)

# Disable toggle button
content = content.replace("onClick={(e) => { e.stopPropagation(); handleTogglePaid(t) }}\n                      className={", "onClick={(e) => { e.stopPropagation(); handleTogglePaid(t) }}\n                      disabled={togglingId === t.id}\n                      className={")

with open('src/app/(app)/HomeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
