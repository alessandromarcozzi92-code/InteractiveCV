import { createSkyline, createStars } from './sceneData'

test('createStars is deterministic for a given seed', () => {
  expect(createStars(20, 7)).toEqual(createStars(20, 7))
})

test('createStars varies with the seed', () => {
  expect(createStars(20, 7)).not.toEqual(createStars(20, 8))
})

test('stars land inside the viewBox', () => {
  for (const star of createStars(60, 1)) {
    expect(star.x).toBeGreaterThanOrEqual(0)
    expect(star.x).toBeLessThanOrEqual(100)
    expect(star.y).toBeGreaterThanOrEqual(0)
    expect(star.y).toBeLessThanOrEqual(100)
    expect([1, 2, 3]).toContain(star.tier)
  }
})

test('createSkyline is deterministic for a given seed', () => {
  expect(createSkyline(10, 3, 60)).toEqual(createSkyline(10, 3, 60))
})

test('buildings respect the height ceiling and carry windows', () => {
  for (const building of createSkyline(10, 3, 60)) {
    expect(building.height).toBeGreaterThan(0)
    expect(building.height).toBeLessThanOrEqual(60)
    expect(building.windows.length).toBeGreaterThan(0)
  }
})

test('buildings tile the full width without gaps', () => {
  const buildings = createSkyline(10, 3, 60)
  const last = buildings[buildings.length - 1]
  expect(buildings[0].x).toBe(0)
  expect(last.x + last.width).toBeCloseTo(100, 5)
})
