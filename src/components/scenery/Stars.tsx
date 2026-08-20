import { createStars } from './sceneData'
import styles from './Scenery.module.css'

const STAR_SEED = 20260820

type StarsProps = { count?: number }

export function Stars({ count = 60 }: StarsProps) {
  const stars = createStars(count, STAR_SEED)

  return (
    <svg
      className={styles.stars}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {stars.map((star, index) => (
        <rect
          key={index}
          x={star.x}
          y={star.y}
          width={star.size}
          height={star.size}
          className={styles.star}
          data-tier={star.tier}
        />
      ))}
    </svg>
  )
}
