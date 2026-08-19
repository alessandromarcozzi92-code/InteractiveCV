import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { NavMenu } from './NavMenu'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderMenu(initialPath = '/stats') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavMenu />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('renders one link per menu item', () => {
  renderMenu()
  expect(screen.getAllByRole('link')).toHaveLength(6)
})

test('marks the current route with aria-current', () => {
  renderMenu('/skills')
  expect(screen.getByRole('link', { name: /SKILLS/ })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: /STATS/ })).not.toHaveAttribute('aria-current')
})

test('navigates with arrow keys and Enter', async () => {
  renderMenu('/stats')
  const menu = screen.getByRole('navigation', { name: 'Sezioni del CV' })
  menu.focus()
  await userEvent.keyboard('{ArrowRight}{Enter}')
  expect(screen.getByTestId('location')).toHaveTextContent('/skills')
})

test('navigates on click', async () => {
  renderMenu('/stats')
  await userEvent.click(screen.getByRole('link', { name: /QUESTS/ }))
  expect(screen.getByTestId('location')).toHaveTextContent('/quests')
})

test('returns to the title screen on Escape', async () => {
  renderMenu('/stats')
  screen.getByRole('navigation', { name: 'Sezioni del CV' }).focus()
  await userEvent.keyboard('{Escape}')
  expect(screen.getByTestId('location')).toHaveTextContent('/')
})
