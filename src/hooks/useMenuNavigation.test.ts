import { act, renderHook } from '@testing-library/react'
import { useMenuNavigation } from './useMenuNavigation'

function pressKey(handler: (event: never) => void, key: string) {
  act(() => {
    handler({ key, preventDefault: () => {} } as never)
  })
}

test('moves forward and wraps past the last item', () => {
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn() }),
  )

  pressKey(result.current.handleKeyDown, 'ArrowRight')
  expect(result.current.activeIndex).toBe(1)

  pressKey(result.current.handleKeyDown, 'ArrowRight')
  pressKey(result.current.handleKeyDown, 'ArrowRight')
  expect(result.current.activeIndex).toBe(0)
})

test('moves backward and wraps before the first item', () => {
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn() }),
  )

  pressKey(result.current.handleKeyDown, 'ArrowLeft')
  expect(result.current.activeIndex).toBe(2)
})

test('activates the current item on Enter', () => {
  const onActivate = vi.fn()
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, initialIndex: 1, onActivate }),
  )

  pressKey(result.current.handleKeyDown, 'Enter')
  expect(onActivate).toHaveBeenCalledWith(1)
})

test('cancels on Escape', () => {
  const onCancel = vi.fn()
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn(), onCancel }),
  )

  pressKey(result.current.handleKeyDown, 'Escape')
  expect(onCancel).toHaveBeenCalledTimes(1)
})

test('ignores unrelated keys', () => {
  const onActivate = vi.fn()
  const { result } = renderHook(() => useMenuNavigation({ itemCount: 3, onActivate }))

  pressKey(result.current.handleKeyDown, 'x')
  expect(result.current.activeIndex).toBe(0)
  expect(onActivate).not.toHaveBeenCalled()
})
