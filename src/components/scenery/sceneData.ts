export type Star = { x: number; y: number; size: number; tier: 1 | 2 | 3 }

export type Building = {
  x: number
  width: number
  height: number
  windows: boolean[]
}

/**
 * Seeded pseudo-random generator. The scene must be byte-identical across
 * renders and test runs, so Math.random is not an option.
 *
 * @param seed - Any integer; the same seed always yields the same sequence.
 * @returns A function producing successive numbers in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Builds the starfield as percentages of the SVG viewBox.
 *
 * @param count - How many stars to place.
 * @param seed - Seed for the layout.
 * @returns Stars ordered as generated; tier 1 is brightest.
 */
export function createStars(count: number, seed: number): Star[] {
  const random = mulberry32(seed)

  return Array.from({ length: count }, () => {
    const roll = random()
    const tier: 1 | 2 | 3 = roll > 0.85 ? 1 : roll > 0.55 ? 2 : 3

    return {
      x: Math.round(random() * 10000) / 100,
      // Stars thin out towards the horizon: squaring biases upward.
      y: Math.round(random() ** 2 * 10000) / 100,
      size: tier === 1 ? 2 : 1,
      tier,
    }
  })
}

/**
 * Builds a row of buildings that tiles the full viewBox width.
 *
 * @param count - How many buildings to place.
 * @param seed - Seed for the layout.
 * @param maxHeight - Tallest possible building, in viewBox percent.
 * @returns Buildings left to right, together spanning exactly 0-100.
 */
export function createSkyline(
  count: number,
  seed: number,
  maxHeight: number,
): Building[] {
  const random = mulberry32(seed)
  const width = 100 / count

  return Array.from({ length: count }, (_, index) => {
    const height = Math.round((0.35 + random() * 0.65) * maxHeight * 100) / 100
    const windowCount = 3 + Math.floor(random() * 6)

    return {
      x: Math.round(index * width * 100) / 100,
      width,
      height,
      windows: Array.from({ length: windowCount }, () => random() > 0.45),
    }
  })
}
