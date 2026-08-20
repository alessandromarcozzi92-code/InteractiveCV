import { MENU_ITEMS } from '../data/menu'

export type SectionPosition = { index: number; total: number }

/**
 * Locates a route within the menu so a screen can show "02 / 06".
 * Derived from MENU_ITEMS so adding a section renumbers every screen.
 *
 * @param path - The route path, e.g. '/skills'.
 * @returns The 1-based position and the total, or null if the path is not
 *   a menu section (the title screen and unknown routes).
 */
export function sectionPosition(path: string): SectionPosition | null {
  const index = MENU_ITEMS.findIndex((item) => item.path === path)
  if (index < 0) return null
  return { index: index + 1, total: MENU_ITEMS.length }
}
