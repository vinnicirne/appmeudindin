/**
 * MEUDINDIN — DEEP DEBUGGER
 * Analisador de saúde do projeto, dependências e gargalos de performance.
 * Uso: npx tsx debug.ts
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║               MEUDINDIN — DEEP DEBUGGER                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

// 1. Verificando Package.json
console.log('📦 Verificando dependências (package.json)...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  if (deps['framer-motion']) console.log('  ✅ framer-motion detectado (Atenção a loops de layout em listas)');
  if (deps['react-joyride']) console.log('  ✅ react-joyride detectado (Exige ssr: false)');
  if (deps['react-confetti']) console.log('  ✅ react-confetti detectado (Exige ssr: false)');
  
} catch (e) {
  console.log('  ❌ Erro ao ler package.json');
}

// 2. Analisando tamanho das páginas e componentes
console.log('\n📊 Analisando peso dos arquivos (Gargalos de Bundle)...');
const heavyFiles: {file: string, size: number}[] = [];

function walkAndSize(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.next')) {
      walkAndSize(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      heavyFiles.push({ file: full.replace(ROOT + path.sep, ''), size: stat.size });
    }
  }
}

walkAndSize(SRC);
heavyFiles.sort((a, b) => b.size - a.size);

const top5 = heavyFiles.slice(0, 5);
top5.forEach((f, i) => {
  const kb = (f.size / 1024).toFixed(1);
  console.log(`  ${i+1}. ${kb} KB - ${f.file}`);
  if (f.size > 20480) { // 20kb
    console.log(`     ⚠️  Arquivo muito grande! Considere quebrar em componentes menores.`);
  }
});

// 3. Checando Rotas de API
console.log('\n🌐 Verificando Rotas de API (Supabase & Webhooks)...');
let apiCount = 0;
let missingDynamic = 0;

function checkApiRoutes(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      checkApiRoutes(full);
    } else if (entry === 'route.ts') {
      apiCount++;
      const content = fs.readFileSync(full, 'utf8');
      if (!content.includes('force-dynamic') && content.includes('supabase')) {
        missingDynamic++;
      }
    }
  }
}

checkApiRoutes(path.join(SRC, 'app', 'api'));
console.log(`  Total de rotas de API: ${apiCount}`);
if (missingDynamic > 0) {
  console.log(`  ℹ️  Dica: ${missingDynamic} rotas usam Supabase mas não tem 'export const dynamic = "force-dynamic"'. O Next.js 14 pode cacheá-las agressivamente.`);
}

console.log('\n✅ Debug finalizado.\n');
