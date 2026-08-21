import { createStars } from './sceneData'
import styles from './Scenery.module.css'

const STAR_SEED = 20260820

type StarsProps = { count?: number }

export function Stars({ count = 90 }: StarsProps) {
  const stars = createStars(count, STAR_SEED)

  return (
    <svg
      className={styles.stars}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/*
       * Zero-length lines, not rects: the viewBox is stretched to the
       * viewport, so a rect sized in viewBox units becomes a slab. A square
       * cap on a non-scaling stroke stays a true pixel square at any size.
       */}
      {stars.map((star, index) => (
        <line
          key={index}
          x1={star.x}
          y1={star.y}
          x2={star.x}
          y2={star.y}
          className={styles.star}
          data-tier={star.tier}
        />
      ))}
    </svg>
  )
}
