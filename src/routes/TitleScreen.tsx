import { useNavigate } from 'react-router-dom'
import { cv } from '../data/cv'
import { MENU_ITEMS } from '../data/menu'
import { PixelButton } from '../components/ui/PixelButton'
import styles from './TitleScreen.module.css'

export function TitleScreen() {
  const navigate = useNavigate()

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{cv.profile.name}</h1>
      <p className={styles.subtitle}>
        {cv.profile.class} · Lv.{cv.profile.level}
      </p>
      <PixelButton onClick={() => navigate(MENU_ITEMS[0].path)}>PRESS START</PixelButton>
    </main>
  )
}
