import type { ReactNode } from 'react'
import styles from './PixelButton.module.css'

type PixelButtonProps = {
  children: ReactNode
  onClick?: () => void
  href?: string
  download?: boolean
}

export function PixelButton({ children, onClick, href, download }: PixelButtonProps) {
  if (href) {
    return (
      <a className={styles.button} href={href} download={download}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {children}
    </button>
  )
}
