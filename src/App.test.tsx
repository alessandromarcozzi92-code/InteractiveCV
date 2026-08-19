import { render, screen } from '@testing-library/react'
import App from './App'

test('boots on the title screen', () => {
  render(<App />)
  expect(screen.getByText('PRESS START')).toBeInTheDocument()
})
