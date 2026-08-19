import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type Progress = { target: number; value: number }

export function useAnimatedNumber(target: number, durationMs = 600, steps = 20): number {
  const reduced = usePrefersReducedMotion()
  const [progress, setProgress] = useState<Progress>({ target, value: 0 })

  // Reset during render rather than in an effect, so a new target restarts
  // the count without an extra render pass. Mirrors useTypewriter.
  if (progress.target !== target) {
    setProgress({ target, value: 0 })
  }

  useEffect(() => {
    if (reduced) return

    let tick = 0
    const timer = setInterval(() => {
      tick += 1
      if (tick >= steps) {
        clearInterval(timer)
        setProgress({ target, value: target })
        return
      }
      setProgress({ target, value: Math.round((target * tick) / steps) })
    }, durationMs / steps)

    return () => clearInterval(timer)
  }, [target, durationMs, steps, reduced])

  return reduced ? target : progress.value
}
