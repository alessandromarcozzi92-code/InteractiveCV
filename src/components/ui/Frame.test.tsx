import { render, screen } from '@testing-library/react'
import { Frame } from './Frame'

test('renders its children', () => {
  render(<Frame>PLAYER PROFILE</Frame>)
  expect(screen.getByText('PLAYER PROFILE')).toBeInTheDocument()
})

test('renders the requested element', () => {
  render(<Frame as="section">CONTENT</Frame>)
  expect(screen.getByText('CONTENT').tagName).toBe('SECTION')
})

test('keeps the caller className alongside its own', () => {
  render(<Frame className="custom">CONTENT</Frame>)
  expect(screen.getByText('CONTENT')).toHaveClass('custom')
})
