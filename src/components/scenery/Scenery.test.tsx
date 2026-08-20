import { render, screen } from '@testing-library/react'
import { Scenery } from './Scenery'

test('exposes no accessible content', () => {
  render(<Scenery />)
  expect(screen.queryAllByRole('img')).toHaveLength(0)
  expect(screen.queryAllByRole('graphics-document')).toHaveLength(0)
  expect(document.body).toHaveTextContent('')
})

test('every svg root is hidden from assistive technology', () => {
  const { container } = render(<Scenery />)
  const roots = container.querySelectorAll('svg')
  expect(roots.length).toBeGreaterThan(0)
  roots.forEach((root) => {
    expect(root).toHaveAttribute('aria-hidden', 'true')
  })
})

test('draws both skyline planes', () => {
  const { container } = render(<Scenery />)
  expect(container.querySelector('[data-plane="far"]')).toBeInTheDocument()
  expect(container.querySelector('[data-plane="near"]')).toBeInTheDocument()
})

test('only the near plane lights windows', () => {
  const { container } = render(<Scenery />)
  const far = container.querySelector('[data-plane="far"]')
  const near = container.querySelector('[data-plane="near"]')
  expect(far?.querySelectorAll('[data-window]')).toHaveLength(0)
  expect(near?.querySelectorAll('[data-window]').length).toBeGreaterThan(0)
})

test('carries the requested intensity', () => {
  const { container, rerender } = render(<Scenery intensity="full" />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'full')
  rerender(<Scenery intensity="muted" />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'muted')
})

test('defaults to the muted intensity', () => {
  const { container } = render(<Scenery />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'muted')
})
