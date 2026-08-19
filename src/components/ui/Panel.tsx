import type { ReactNode } from 'react'
import { Frame } from './Frame'
import styles from './Panel.module.css'

type PanelProps = {
  title: string
  children: ReactNode
  as?: 'section' | 'article' | 'li'
  className?: string
}

export function Panel({ title, children, as = 'section', className }: PanelProps) {
  return (
    <Frame as={as} className={className}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </Frame>
  )
}
