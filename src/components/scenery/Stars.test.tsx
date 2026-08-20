import { render } from '@testing-library/react'
import { Moon } from './Moon'
import { Stars } from './Stars'

test('Stars renders one rect per star', () => {
  const { container } = render(<Stars count={12} />)
  expect(container.querySelectorAll('rect')).toHaveLength(12)
})

test('Stars is hidden from assistive technology', () => {
  const { container } = render(<Stars count={12} />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('Stars renders identically twice', () => {
  const first = render(<Stars count={30} />).container.innerHTML
  const second = render(<Stars count={30} />).container.innerHTML
  expect(first).toBe(second)
})

test('Moon is hidden from assistive technology', () => {
  const { container } = render(<Moon />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
