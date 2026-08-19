import { useCallback, useState } from 'react'
import type { KeyboardEvent } from 'react'

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'd', 'D']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'a', 'A']
const ACTIVATE_KEYS = ['Enter', ' ']

export type UseMenuNavigationOptions = {
  itemCount: number
  initialIndex?: number
  onActivate: (index: number) => void
  onCancel?: () => void
}

export function useMenuNavigation({
  itemCount,
  initialIndex = 0,
  onActivate,
  onCancel,
}: UseMenuNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (NEXT_KEYS.includes(event.key)) {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % itemCount)
        return
      }

      if (PREV_KEYS.includes(event.key)) {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + itemCount) % itemCount)
        return
      }

      if (ACTIVATE_KEYS.includes(event.key)) {
        event.preventDefault()
        onActivate(activeIndex)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel?.()
      }
    },
    [activeIndex, itemCount, onActivate, onCancel],
  )

  return { activeIndex, setActiveIndex, handleKeyDown }
}
