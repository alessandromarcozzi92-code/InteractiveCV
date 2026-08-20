import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'

test('renders the title as a level 2 heading', () => {
  render(<Panel title="SKILL TREE">body</Panel>)
  expect(screen.getByRole('heading', { level: 2, name: 'SKILL TREE' })).toBeInTheDocument()
})

test('renders its children', () => {
  render(<Panel title="SKILL TREE">body</Panel>)
  expect(screen.getByText('body')).toBeInTheDocument()
})

test('renders no heading when no title is given', () => {
  render(<Panel>body</Panel>)
  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  expect(screen.getByText('body')).toBeInTheDocument()
})
