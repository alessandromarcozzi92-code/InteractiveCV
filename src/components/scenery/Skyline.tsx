import type { CSSProperties } from 'react'
import { createSkyline } from './sceneData'
import styles from './Scenery.module.css'

const PLANE_CONFIG = {
  far: { seed: 1312, count: 26, maxHeight: 34, windows: false },
  near: { seed: 8471, count: 16, maxHeight: 56, windows: true },
} as const

/** Rows of windows arrive in waves; four reads as a city, not a chase light. */
const WAVES = 4

type SkylineProps = { plane: 'far' | 'near' }

export function Skyline({ plane }: SkylineProps) {
  const { seed, count, maxHeight, windows } = PLANE_CONFIG[plane]
  const buildings = createSkyline(count, seed, maxHeight)

  return (
    <svg
      className={styles.skyline}
      data-plane={plane}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {buildings.map((building, index) => (
        <g key={index}>
          <rect
            className={styles.building}
            x={building.x}
            y={100 - building.height}
            width={building.width}
            height={building.height}
          />
          {windows
            ? building.windows.map((lit, windowIndex) => {
                if (!lit) return null

                const column = windowIndex % building.columns
                const row = Math.floor(windowIndex / building.columns)
                const step = building.width / (building.columns + 1)

                return (
                  <line
                    key={windowIndex}
                    data-window=""
                    data-wave={(index + row) % WAVES}
                    className={styles.window}
                    x1={building.x + step * (column + 1)}
                    y1={100 - building.height + 3.4 + row * 3.4}
                    x2={building.x + step * (column + 1)}
                    y2={100 - building.height + 3.4 + row * 3.4}
                    style={{ '--wave': (index + row) % WAVES } as CSSProperties}
                  />
                )
              })
            : null}
        </g>
      ))}
    </svg>
  )
}
