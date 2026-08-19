import { act, renderHook } from '@testing-library/react'
import { useTypewriter } from './useTypewriter'
import { setReducedMotion } from '../test/setup'

test('reveals the text one character at a time', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useTypewriter('ABC', 10))

  expect(result.current).toBe('')
  act(() => {
    vi.advanceTimersByTime(10)
  })
  expect(result.current).toBe('A')
  act(() => {
    vi.advanceTimersByTime(20)
  })
  expect(result.current).toBe('ABC')
  vi.useRealTimers()
})

test('shows the full text immediately under reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => useTypewriter('ABC', 10))
  expect(result.current).toBe('ABC')
})
