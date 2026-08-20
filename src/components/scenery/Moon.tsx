import styles from './Scenery.module.css'

export function Moon() {
  return (
    <svg
      className={styles.moon}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {/* Stepped disc: rectangles, not a circle — a circle would be
          anti-aliased and read as a different medium. */}
      <rect x="5" y="2" width="6" height="1" />
      <rect x="3" y="3" width="10" height="2" />
      <rect x="2" y="5" width="12" height="6" />
      <rect x="3" y="11" width="10" height="2" />
      <rect x="5" y="13" width="6" height="1" />
    </svg>
  )
}
