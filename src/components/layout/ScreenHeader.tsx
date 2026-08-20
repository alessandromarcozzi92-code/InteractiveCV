import { sectionPosition } from '../../lib/sections'
import styles from './ScreenHeader.module.css'

const pad = (value: number) => String(value).padStart(2, '0')

type ScreenHeaderProps = { title: string; path: string }

export function ScreenHeader({ title, path }: ScreenHeaderProps) {
  const position = sectionPosition(path)

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {position ? (
        <p className={styles.index}>
          {pad(position.index)} / {pad(position.total)}
        </p>
      ) : null}
    </div>
  )
}
