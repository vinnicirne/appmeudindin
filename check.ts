/**
 * MEUDINDIN — DEBUG CHECKER
 * Análise estática: encontra padrões que causam crashes, freezes e hydration mismatches.
 * Uso: npx tsx check.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface Issue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  file: string
  line: number
  pattern: string
  message: string
}

const issues: Issue[] = []
const SRC = path.join(process.cwd(), 'src')

// ─── Helpers ───────────────────────────────────────────────────────────────

function walkDir(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)
    if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.next')) {
      walkDir(full, results)
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      results.push(full)
    }
  }
  return results
}

function addIssue(severity: Issue['severity'], file: string, line: number, pattern: string, message: string) {
  issues.push({ severity, file: file.replace(process.cwd() + path.sep, ''), line, pattern, message })
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const rel = filePath.replace(process.cwd() + path.sep, '')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    // ── 1. HYDRATION: uso de useTheme/Date.now/Math.random sem mounted guard ──
    if (trimmed.includes('useTheme()') && !content.includes('mounted')) {
      if (!trimmed.startsWith('//')) {
        addIssue('CRITICAL', rel, lineNum,
          'useTheme() sem mounted guard',
          'useTheme() retorna undefined no servidor → hydration mismatch → React reconstrói o DOM a cada navegação → freeze acumulativo'
        )
      }
    }

    if ((trimmed.includes('Date.now()') || trimmed.includes('Math.random()')) && !trimmed.startsWith('//')) {
      if (content.includes("'use client'") && !content.includes('useEffect')) {
        addIssue('WARNING', rel, lineNum,
          'Date.now()/Math.random() em client component sem useEffect',
          'Valores dinâmicos durante render causam hydration mismatch'
        )
      }
    }

    // ── 2. AUTO-TRIGGER: setTimeout/setInterval chamando APIs pesadas no mount ──
    if (trimmed.includes('setTimeout') && content.includes('useEffect')) {
      if (trimmed.includes('handleUnlock') || trimmed.includes('credentials') || trimmed.includes('biom')) {
        addIssue('CRITICAL', rel, lineNum,
          'setTimeout auto-triggering API bloqueante',
          'navigator.credentials.get() suspende toda execução JS (até 60s) → app congela completamente'
        )
      }
    }

    // ── 3. FRAMER-MOTION: prop "layout" em listas/grids ──
    if (trimmed.includes('layout') && trimmed.includes('motion.') || 
        (trimmed === 'layout' && lines[idx - 1]?.includes('motion.'))) {
      addIssue('WARNING', rel, lineNum,
        'framer-motion prop "layout" detectada',
        'layout em CSS Grid causa loop infinito de cálculo de posição → CPU 100% → freeze'
      )
    }

    // ── 4. FRAMER-MOTION: import namespace completo ──
    if (trimmed.includes('import * as motion from')) {
      addIssue('CRITICAL', rel, lineNum,
        'import * as motion (namespace completo)',
        'Força carregamento síncrono de todo o bundle framer-motion (~150kb) → bloqueia render inicial'
      )
    }

    // ── 5. BIBLIOTECAS BROWSER sem dynamic/ssr:false ──
    const browserOnlyLibs = ['react-confetti', 'react-use', 'react-joyride', 'react-swipeable']
    browserOnlyLibs.forEach(lib => {
      if (trimmed.includes(`from '${lib}'`) || trimmed.includes(`from "${lib}"`)) {
        if (!content.includes('dynamic(') && !content.includes("ssr: false")) {
          addIssue('CRITICAL', rel, lineNum,
            `import estático de ${lib}`,
            `${lib} usa APIs de browser (window/canvas/navigator). Import estático causa crash no SSR do Next.js → navegação para a página falha`
          )
        }
      }
    })

    // ── 6. framer-motion drag em listas grandes ──
    if (trimmed.includes('drag=') && (trimmed.includes('"x"') || trimmed.includes("'x'"))) {
      addIssue('WARNING', rel, lineNum,
        'framer-motion drag="x" em elemento de lista',
        'drag em cada item de lista (N itens = N listeners de touch) → mobile trava ao rolar'
      )
    }

    // ── 7. navigator.credentials sem try/catch ou sem verificação de suporte ──
    if (trimmed.includes('navigator.credentials')) {
      const blockStart = Math.max(0, idx - 10)
      const blockEnd = Math.min(lines.length, idx + 5)
      const block = lines.slice(blockStart, blockEnd).join('\n')
      if (!block.includes('try {') && !block.includes('try{')) {
        addIssue('WARNING', rel, lineNum,
          'navigator.credentials sem try/catch',
          'Se biometria falhar/cancelar sem catch, a Promise rejeita e pode derrubar o componente'
        )
      }
    }

    // ── 8. useSwipeable sem preventScrollOnSwipe ou touchAction ──
    if (trimmed.includes('useSwipeable')) {
      const blockStart = idx
      const blockEnd = Math.min(lines.length, idx + 20)
      const block = lines.slice(blockStart, blockEnd).join('\n')
      if (!block.includes('preventScrollOnSwipe') && !block.includes('touchAction')) {
        addIssue('WARNING', rel, lineNum,
          'useSwipeable sem configuração de scroll',
          'Sem preventScrollOnSwipe:false e touchAction:"pan-y", o handler intercepta TODO toque vertical → scroll bloqueado'
        )
      }
    }

    // ── 9. pages server-side sem export dynamic = force-dynamic usando supabase ──
    if (trimmed.includes("from '@/utils/supabase/server'") && !content.includes("force-dynamic") && !content.includes("revalidate")) {
      if (!content.includes("'use client'")) {
        addIssue('WARNING', rel, lineNum,
          'Server Component com Supabase sem force-dynamic',
          'Next.js pode cachear a página e servir dados desatualizados. Adicione: export const dynamic = "force-dynamic"'
        )
      }
    }

    // ── 10. Detecção de Link sem prefetch={false} no nav global ──
    if (rel.includes('BottomNav') || rel.includes('Sidebar')) {
      if (trimmed.includes('<Link') && !trimmed.includes('prefetch={false}')) {
        addIssue('WARNING', rel, lineNum,
          'Link sem prefetch={false} no nav global',
          'Next.js faz prefetch de todas as rotas visiveis → dispara múltiplas requisições ao Supabase em paralelo → memory spike → freeze'
        )
      }
    }
  })
}

// ─── Main ──────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║          MEUDINDIN — DEBUG CHECKER v1.0                 ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

const files = walkDir(SRC)
console.log(`📂 Analisando ${files.length} arquivos em ${SRC}\n`)

files.forEach(scanFile)

if (issues.length === 0) {
  console.log('✅ Nenhum padrão problemático encontrado!\n')
  process.exit(0)
}

// Ordenar por severidade
const order = { CRITICAL: 0, WARNING: 1, INFO: 2 }
issues.sort((a, b) => order[a.severity] - order[b.severity])

const criticals = issues.filter(i => i.severity === 'CRITICAL')
const warnings = issues.filter(i => i.severity === 'WARNING')

console.log(`🔴 CRÍTICOS: ${criticals.length}   ⚠️  WARNINGS: ${warnings.length}\n`)
console.log('─'.repeat(70))

issues.forEach(issue => {
  const badge = issue.severity === 'CRITICAL' ? '🔴 CRÍTICO' : issue.severity === 'WARNING' ? '⚠️  WARNING' : 'ℹ️  INFO'
  console.log(`\n${badge}`)
  console.log(`  Arquivo: ${issue.file}:${issue.line}`)
  console.log(`  Padrão:  ${issue.pattern}`)
  console.log(`  Motivo:  ${issue.message}`)
})

console.log('\n' + '─'.repeat(70))
console.log(`\n📋 Total: ${issues.length} problemas encontrados (${criticals.length} críticos)\n`)

if (criticals.length > 0) {
  process.exit(1)
}
