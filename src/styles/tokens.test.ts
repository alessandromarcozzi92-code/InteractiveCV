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

const tokens = readFileSync(join(SRC, 'styles/tokens.css'), 'utf8')

test('declares the environment palette', () => {
  for (const name of [
    '--sky-zenith',
    '--sky-horizon',
    '--city-far',
    '--city-near',
    '--star',
    '--window',
    '--glow-accent',
    '--glow-cyan',
  ]) {
    expect(tokens).toContain(`${name}:`)
  }
})

test('declares a whole-pixel type scale', () => {
  const sizes = ['12px', '14px', '16px', '20px', '24px', '32px', '48px', '64px']
  sizes.forEach((size, index) => {
    expect(tokens).toContain(`--fs-${index + 1}: ${size}`)
  })
})

test('declares the three-plane depth scale', () => {
  for (const name of ['--z-scenery', '--z-content', '--z-shell']) {
    expect(tokens).toContain(`${name}:`)
  }
})

test('no stylesheet hardcodes a font-size outside the scale', () => {
  const offenders = cssFiles(SRC)
    .filter((path) => !path.endsWith('tokens.css'))
    .flatMap((path) => {
      const source = readFileSync(path, 'utf8')
      const matches = source.match(/font-size:\s*\d+px/g) ?? []
      return matches.map((match) => `${path}: ${match}`)
    })

  expect(offenders).toEqual([])
})
