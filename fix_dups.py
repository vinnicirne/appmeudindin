import re
with open('src/app/(app)/HomeClient.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove duplicate import
text = re.sub(r'import \{ useQueryClient \} from \'@tanstack/react-query\'\n\nimport dynamic', 'import dynamic', text)

# 2. Remove duplicate invalidateQueries
text = text.replace("queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); queryClient.invalidateQueries({ queryKey: ['dashboardData'] })", "queryClient.invalidateQueries({ queryKey: ['dashboardData'] })")

# 3. There is an extra one in togglePaidTransactionAction
text = text.replace("""    const res = await togglePaidTransactionAction(t.id, newStatus)
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })""", """    const res = await togglePaidTransactionAction(t.id, newStatus)""")

# 4. There is an extra one in deleteTransactionAction
text = text.replace("""await deleteTransactionAction(transactionToDelete)
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    setIsDeleting(false)""", """await deleteTransactionAction(transactionToDelete)
    setIsDeleting(false)""")

with open('src/app/(app)/HomeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
