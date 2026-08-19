import type { ReactNode } from 'react'
import styles from './Frame.module.css'

type FrameElement = 'div' | 'section' | 'article' | 'li'

type FrameProps = {
  children: ReactNode
  as?: FrameElement
  className?: string
}

export function Frame({ children, as: Tag = 'div', className }: FrameProps) {
  const classes = [styles.frame, className].filter(Boolean).join(' ')
  return <Tag className={classes}>{children}</Tag>
}
