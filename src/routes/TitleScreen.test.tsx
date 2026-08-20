import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TitleScreen } from './TitleScreen'

function renderTitle() {
  return render(
    <MemoryRouter>
      <TitleScreen />
    </MemoryRouter>,
  )
}

test('mounts the scenery at full intensity', () => {
  const { container } = renderTitle()
  expect(container.querySelector('[data-intensity]')).toHaveAttribute(
    'data-intensity',
    'full',
  )
})

test('the scanline overlay is decorative', () => {
  const { container } = renderTitle()
  const scanlines = container.querySelector('[data-scanlines]')
  expect(scanlines).toBeInTheDocument()
  expect(scanlines).toHaveAttribute('aria-hidden', 'true')
})

test('still offers the start control', () => {
  renderTitle()
  expect(screen.getByRole('button', { name: 'PRESS START' })).toBeInTheDocument()
})
