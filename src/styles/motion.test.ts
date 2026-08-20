import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

/**
 * Removes every block introduced by the named at-rules, braces balanced.
 *
 * @supports is stripped because declarations inside it are exactly what
 * the contract permits. @keyframes is stripped because `opacity: 0` in a
 * keyframe is a frame of an animation, not a rule that hides an element:
 * the existing `blink` animation legitimately contains one.
 */
function withoutBlocks(source: string, atRules: string[]): string {
  let output = ''
  let index = 0

  while (index < source.length) {
    const starts = atRules
      .map((rule) => source.indexOf(rule, index))
      .filter((position) => position >= 0)

    if (starts.length === 0) {
      output += source.slice(index)
      break
    }

    const start = Math.min(...starts)
    output += source.slice(index, start)

    let depth = 0
    let cursor = source.indexOf('{', start)
    if (cursor < 0) break

    for (; cursor < source.length; cursor += 1) {
      if (source[cursor] === '{') depth += 1
      if (source[cursor] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }
    index = cursor + 1
  }

  return output
}

const unconditional = (source: string) =>
  withoutBlocks(source, ['@supports', '@keyframes'])

const sheets = cssFiles(SRC).map((path) => ({
  path,
  source: readFileSync(path, 'utf8'),
}))

test('nothing is hidden outside an @supports block', () => {
  const offenders = sheets
    .filter(({ source }) => /opacity:\s*0\s*[;}]/.test(unconditional(source)))
    .map(({ path }) => path)

  expect(offenders).toEqual([])
})

test('scroll-driven animation is only declared inside @supports', () => {
  const offenders = sheets
    .filter(({ source }) => /animation-timeline/.test(unconditional(source)))
    .map(({ path }) => path)

  expect(offenders).toEqual([])
})

test('motion.css disables its animations under reduced motion', () => {
  const motion = readFileSync(join(SRC, 'styles/motion.css'), 'utf8')
  expect(motion).toContain('prefers-reduced-motion: reduce')
  expect(motion).toMatch(/animation:\s*none/)
})
