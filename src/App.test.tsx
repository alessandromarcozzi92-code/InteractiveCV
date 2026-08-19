import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the arcade shell root landmark', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
})
