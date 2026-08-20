import type { ReactNode } from 'react'
import styles from './Frame.module.css'

type FrameElement = 'div' | 'section' | 'article' | 'li'

type FrameProps = {
  children: ReactNode
  as?: FrameElement
  className?: string
  /** `raised` lifts the frame off the scene with a stronger shadow. */
  depth?: 'flat' | 'raised'
}

export function Frame({
  children,
  as: Tag = 'div',
  className,
  depth = 'flat',
}: FrameProps) {
  const classes = [styles.frame, className].filter(Boolean).join(' ')
  return (
    <Tag className={classes} data-depth={depth}>
      {children}
    </Tag>
  )
}
