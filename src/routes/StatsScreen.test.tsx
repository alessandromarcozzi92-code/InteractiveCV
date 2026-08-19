import { render, screen } from '@testing-library/react'
import { StatsScreen } from './StatsScreen'
import type { Profile } from '../data/cv'

const profile: Profile = {
  name: 'TEST PLAYER',
  class: 'Frontend Engineer',
  level: 12,
  location: 'Roma',
  bio: 'Bio di prova.',
  email: 'test@example.com',
  links: [{ label: 'GITHUB', url: 'https://github.com/' }],
}

test('renders the profile fields as labelled rows', () => {
  render(<StatsScreen profile={profile} />)
  expect(screen.getByText('CLASS')).toBeInTheDocument()
  expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
  expect(screen.getByText('LEVEL')).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Bio di prova.')).toBeInTheDocument()
})
