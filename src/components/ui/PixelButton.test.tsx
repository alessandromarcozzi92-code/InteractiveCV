import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixelButton } from './PixelButton'

test('renders a button and calls onClick', async () => {
  const onClick = vi.fn()
  render(<PixelButton onClick={onClick}>START</PixelButton>)
  await userEvent.click(screen.getByRole('button', { name: 'START' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('renders a download link when href is given', () => {
  render(
    <PixelButton href="/cv.pdf" download>
      SAVE GAME
    </PixelButton>,
  )
  const link = screen.getByRole('link', { name: 'SAVE GAME' })
  expect(link).toHaveAttribute('href', '/cv.pdf')
  expect(link).toHaveAttribute('download')
})
