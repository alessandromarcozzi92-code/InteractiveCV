import type { ReactNode } from 'react'
import { Frame } from './Frame'
import styles from './Panel.module.css'

type PanelProps = {
  /** Omit when the screen already renders its heading in ScreenHeader. */
  title?: string
  children: ReactNode
  as?: 'section' | 'article' | 'li'
  className?: string
  depth?: 'flat' | 'raised'
}

export function Panel({ title, children, as = 'section', className, depth }: PanelProps) {
  return (
    <Frame as={as} className={className} depth={depth}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.body}>{children}</div>
    </Frame>
  )
}
