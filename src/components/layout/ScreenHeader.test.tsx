import { render, screen } from '@testing-library/react'
import { ScreenHeader } from './ScreenHeader'

test('renders the title as the single level 2 heading', () => {
  render(<ScreenHeader title="SKILL TREE" path="/skills" />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 2, name: 'SKILL TREE' })).toBeInTheDocument()
})

test('shows the section index as readable text', () => {
  render(<ScreenHeader title="SKILL TREE" path="/skills" />)
  expect(screen.getByText('02 / 06')).toBeInTheDocument()
})

test('omits the index for a path outside the menu', () => {
  render(<ScreenHeader title="GAME OVER" path="/nope" />)
  expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument()
})
