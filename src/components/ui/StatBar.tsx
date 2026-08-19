import type { CSSProperties } from 'react'
import { clamp } from '../../lib/format'
import styles from './StatBar.module.css'

type StatBarProps = {
  label: string
  level: number
  blocks?: number
}

export function StatBar({ label, level, blocks = 20 }: StatBarProps) {
  const value = clamp(Math.round(level), 0, 100)
  const filled = Math.round((value / 100) * blocks)

  return (
    <div className={styles.row}>
      <span>{label}</span>
      <span
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={styles.track}
      >
        {Array.from({ length: blocks }, (_, index) => (
          <span
            key={index}
            className={styles.cell}
            data-state={index < filled ? 'on' : 'off'}
            style={{ '--i': index } as CSSProperties}
            aria-hidden="true"
          />
        ))}
      </span>
      <span className={styles.value}>Lv.{value}</span>
    </div>
  )
}
