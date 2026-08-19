import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export function useTypewriter(text: string, speedMs = 35): string {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduced) return
    setCount(0)
    const timer = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, speedMs)
    return () => clearInterval(timer)
  }, [text, speedMs, reduced])

  return reduced ? text : text.slice(0, count)
}
