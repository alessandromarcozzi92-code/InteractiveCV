import { act, renderHook } from '@testing-library/react'
import { useAnimatedNumber } from './useAnimatedNumber'
import { setReducedMotion } from '../test/setup'

test('counts up to the target in discrete steps', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useAnimatedNumber(20, 200, 20))

  expect(result.current).toBe(0)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(result.current).toBe(10)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(result.current).toBe(20)
  vi.useRealTimers()
})

test('shows the target immediately under reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => useAnimatedNumber(20, 200, 20))
  expect(result.current).toBe(20)
})
