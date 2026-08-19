import { render, screen } from '@testing-library/react'
import { SkillsScreen } from './SkillsScreen'
import type { Skill } from '../data/cv'

const skills: Skill[] = [
  { name: 'React', level: 80, category: 'framework' },
  { name: 'TypeScript', level: 75, category: 'lang' },
  { name: 'Git', level: 70, category: 'tool' },
]

test('renders one meter per skill', () => {
  render(<SkillsScreen skills={skills} />)
  expect(screen.getAllByRole('meter')).toHaveLength(3)
})

test('groups skills by category heading', () => {
  render(<SkillsScreen skills={skills} />)
  expect(screen.getByRole('heading', { name: 'FRAMEWORK' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'LANG' })).toBeInTheDocument()
})

test('shows no empty category when a category has no skills', () => {
  render(<SkillsScreen skills={[skills[0]]} />)
  expect(screen.queryByRole('heading', { name: 'SOFT' })).not.toBeInTheDocument()
})
