import { render, screen } from '@testing-library/react'
import { ContactScreen } from './ContactScreen'
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

test('offers the CV download', () => {
  render(<ContactScreen profile={profile} />)
  const download = screen.getByRole('link', { name: 'SAVE GAME' })
  expect(download).toHaveAttribute('href', '/cv.pdf')
  expect(download).toHaveAttribute('download')
})

test('renders a mailto link and the external links', () => {
  render(<ContactScreen profile={profile} />)
  expect(screen.getByRole('link', { name: 'test@example.com' })).toHaveAttribute(
    'href',
    'mailto:test@example.com',
  )
  expect(screen.getByRole('link', { name: 'GITHUB' })).toHaveAttribute(
    'href',
    'https://github.com/',
  )
})
