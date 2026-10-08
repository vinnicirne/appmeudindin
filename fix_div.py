import re
with open('src/app/(app)/HomeClient.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'</div>\s*</div>\s*<div className="flex gap-3 tour-quick-add">', '</div>\n\n        <div className="flex gap-3 tour-quick-add">', text)

with open('src/app/(app)/HomeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
