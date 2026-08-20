import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ArcadeShell } from './ArcadeShell'

function renderShell(path = '/skills') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ArcadeShell />}>
          <Route path="/skills" element={<p>contenuto</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('renders the scenery behind the content', () => {
  const { container } = renderShell()
  const scenery = container.querySelector('[data-intensity]')
  expect(scenery).toBeInTheDocument()
  expect(scenery).toHaveAttribute('aria-hidden', 'true')
})

test('mounts the scenery muted behind content screens', () => {
  const { container } = renderShell()
  expect(container.querySelector('[data-intensity]')).toHaveAttribute(
    'data-intensity',
    'muted',
  )
})

test('keeps the skip link pointing at the screen', () => {
  renderShell()
  expect(screen.getByRole('link', { name: 'Vai al contenuto' })).toHaveAttribute(
    'href',
    '#screen',
  )
})

test('renders the outlet content', () => {
  renderShell()
  expect(screen.getByText('contenuto')).toBeInTheDocument()
})
