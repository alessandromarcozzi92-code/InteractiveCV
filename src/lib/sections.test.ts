import { sectionPosition } from './sections'
import { MENU_ITEMS } from '../data/menu'

test('numbers sections from one, in menu order', () => {
  expect(sectionPosition('/stats')).toEqual({ index: 1, total: MENU_ITEMS.length })
  expect(sectionPosition('/skills')).toEqual({ index: 2, total: MENU_ITEMS.length })
})

test('numbers the last menu entry as the total', () => {
  const last = MENU_ITEMS[MENU_ITEMS.length - 1]
  expect(sectionPosition(last.path)?.index).toBe(MENU_ITEMS.length)
})

test('returns null for a path outside the menu', () => {
  expect(sectionPosition('/')).toBeNull()
  expect(sectionPosition('/nope')).toBeNull()
})
