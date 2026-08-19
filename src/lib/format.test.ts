import { clamp, formatPeriod } from './format'

test('clamp keeps a value inside the range', () => {
  expect(clamp(150, 0, 100)).toBe(100)
  expect(clamp(-5, 0, 100)).toBe(0)
  expect(clamp(42, 0, 100)).toBe(42)
})

test('formatPeriod joins the two ends with an arrow', () => {
  expect(formatPeriod('2019', '2022')).toBe('2019 → 2022')
})

test('formatPeriod keeps the NOW sentinel', () => {
  expect(formatPeriod('2022', 'NOW')).toBe('2022 → NOW')
})
