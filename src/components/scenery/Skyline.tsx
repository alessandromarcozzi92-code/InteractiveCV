import type { CSSProperties } from 'react'
import { createSkyline } from './sceneData'
import styles from './Scenery.module.css'

const PLANE_CONFIG = {
  far: { seed: 1312, count: 22, maxHeight: 38, windows: false },
  near: { seed: 8471, count: 13, maxHeight: 62, windows: true },
} as const

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
            ? building.windows.map((lit, windowIndex) =>
                lit ? (
                  <rect
                    key={windowIndex}
                    data-window=""
                    className={styles.window}
                    x={building.x + building.width * 0.25}
                    y={100 - building.height + 2 + windowIndex * 3}
                    width={building.width * 0.5}
                    height={1.2}
                    style={{ '--w': windowIndex } as CSSProperties}
                  />
                ) : null,
              )
            : null}
        </g>
      ))}
    </svg>
  )
}
