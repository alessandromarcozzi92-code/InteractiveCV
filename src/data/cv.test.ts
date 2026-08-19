import { cv } from './cv'

test('every skill level sits between 0 and 100', () => {
  for (const skill of cv.skills) {
    expect(skill.level).toBeGreaterThanOrEqual(0)
    expect(skill.level).toBeLessThanOrEqual(100)
  }
})

test('quest ids are unique', () => {
  const ids = cv.quests.map((quest) => quest.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('the profile exposes at least one contact link', () => {
  expect(cv.profile.links.length).toBeGreaterThan(0)
  expect(cv.profile.email).toMatch(/@/)
})
