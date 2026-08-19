import { render, screen } from '@testing-library/react'
import { StatBar } from './StatBar'

test('exposes the level through a meter role', () => {
  render(<StatBar label="React" level={80} />)
  const meter = screen.getByRole('meter', { name: 'React' })
  expect(meter).toHaveAttribute('aria-valuenow', '80')
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '100')
})

test('clamps out-of-range levels', () => {
  const { rerender } = render(<StatBar label="React" level={150} />)
  expect(screen.getByRole('meter', { name: 'React' })).toHaveAttribute('aria-valuenow', '100')
  rerender(<StatBar label="React" level={-5} />)
  expect(screen.getByRole('meter', { name: 'React' })).toHaveAttribute('aria-valuenow', '0')
})

test('fills blocks proportionally to the level', () => {
  const { container } = render(<StatBar label="React" level={50} blocks={20} />)
  expect(container.querySelectorAll('[data-state="on"]')).toHaveLength(10)
  expect(container.querySelectorAll('[data-state="off"]')).toHaveLength(10)
})

test('shows the level as text, not only as a bar', () => {
  render(<StatBar label="React" level={80} />)
  expect(screen.getByText('Lv.80')).toBeInTheDocument()
})
