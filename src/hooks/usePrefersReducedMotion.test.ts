import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { setReducedMotion } from '../test/setup'

test('reports false by default', () => {
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(false)
})

test('reports true when the user asked for reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(true)
})
