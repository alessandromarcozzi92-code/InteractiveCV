import { render, screen } from '@testing-library/react'
import { QuestsScreen } from './QuestsScreen'
import type { Quest } from '../data/cv'

const quests: Quest[] = [
  {
    id: 'q1',
    title: 'Frontend Engineer',
    org: 'Acme',
    from: '2022',
    to: 'NOW',
    achievements: ['Ridotto il tempo di build del 40%'],
    tech: ['React'],
  },
]

test('renders each quest with role, org and period', () => {
  render(<QuestsScreen quests={quests} />)
  expect(screen.getByRole('heading', { name: /Frontend Engineer/ })).toBeInTheDocument()
  expect(screen.getByText('Acme')).toBeInTheDocument()
  expect(screen.getByText('2022 → NOW')).toBeInTheDocument()
})

test('lists the achievements', () => {
  render(<QuestsScreen quests={quests} />)
  expect(screen.getByText('Ridotto il tempo di build del 40%')).toBeInTheDocument()
})

test('shows an empty-state message with no quests', () => {
  render(<QuestsScreen quests={[]} />)
  expect(screen.getByText('Nessuna quest registrata.')).toBeInTheDocument()
})
