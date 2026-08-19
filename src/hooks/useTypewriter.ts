import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type Progress = { text: string; count: number }

export function useTypewriter(text: string, speedMs = 35): string {
  const reduced = usePrefersReducedMotion()
  const [progress, setProgress] = useState<Progress>({ text, count: 0 })

  // Reset during render rather than in an effect: a new text starts from
  // scratch without the extra render pass an effect-based reset would cost.
  if (progress.text !== text) {
    setProgress({ text, count: 0 })
  }

  useEffect(() => {
    if (reduced) return

    const timer = setInterval(() => {
      setProgress((current) =>
        current.count >= current.text.length
          ? current
          : { ...current, count: current.count + 1 },
      )
    }, speedMs)

    return () => clearInterval(timer)
  }, [text, speedMs, reduced])

  return reduced ? text : text.slice(0, progress.count)
}
