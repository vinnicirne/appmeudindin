import * as fs from 'fs';
import * as path from 'path';

function walk(d: string) {
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f === 'route.ts' || f === 'page.tsx') {
      let c = fs.readFileSync(p, 'utf8');
      if (!c.includes('force-dynamic') && c.includes('supabase') && !c.includes("'use client'") && !c.includes('"use client"')) {
        c = `export const dynamic = 'force-dynamic';\n` + c;
        fs.writeFileSync(p, c, 'utf8');
        console.log('Fixed: ' + p);
      }
    }
  });
}

walk('src/app');
