import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './routes'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

test('the root path shows the title screen', () => {
  renderAt('/')
  expect(screen.getByText('PRESS START')).toBeInTheDocument()
})

test.each([
  ['/stats', 'PLAYER PROFILE'],
  ['/skills', 'SKILL TREE'],
  ['/quests', 'QUEST LOG'],
  ['/training', 'TRAINING GROUNDS'],
  ['/inventory', 'INVENTORY'],
  ['/contact', 'CONTACT'],
])('%s renders its screen heading', (path, heading) => {
  renderAt(path)
  expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
})

test('an unknown path shows the game over screen', () => {
  renderAt('/nope')
  expect(screen.getByRole('heading', { level: 2, name: 'GAME OVER' })).toBeInTheDocument()
})

test('section screens are wrapped in the arcade shell', () => {
  renderAt('/skills')
  expect(screen.getByRole('navigation', { name: 'Sezioni del CV' })).toBeInTheDocument()
})
