import { useNavigate } from 'react-router-dom'
import { cv } from '../data/cv'
import { MENU_ITEMS } from '../data/menu'
import { PixelButton } from '../components/ui/PixelButton'
import { useTypewriter } from '../hooks/useTypewriter'
import styles from './TitleScreen.module.css'

export function TitleScreen() {
  const navigate = useNavigate()
  const title = useTypewriter(cv.profile.name, 60)

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{title || ' '}</h1>
      <p className={styles.subtitle}>
        {cv.profile.class} · Lv.{cv.profile.level}
      </p>
      <span className="blink">
        <PixelButton onClick={() => navigate(MENU_ITEMS[0].path)}>PRESS START</PixelButton>
      </span>
    </main>
  )
}
