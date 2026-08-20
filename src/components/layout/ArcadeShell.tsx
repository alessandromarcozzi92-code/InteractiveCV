import { Link, Outlet, useLocation } from 'react-router-dom'
import { cv } from '../../data/cv'
import { Scenery } from '../scenery/Scenery'
import { NavMenu } from './NavMenu'
import styles from './ArcadeShell.module.css'

export function ArcadeShell() {
  const location = useLocation()

  return (
    <div className={styles.shell}>
      <Scenery intensity="muted" />
      <header className={styles.header}>
        <a className={styles.skip} href="#screen">
          Vai al contenuto
        </a>
        <h1 className={styles.brand}>
          <Link to="/">{cv.profile.name}</Link>
        </h1>
        <NavMenu />
      </header>
      {/* Keyed by pathname so React remounts it and the wipe restarts. */}
      <main id="screen" key={location.pathname} className={`${styles.screen} wipe`}>
        <Outlet />
      </main>
    </div>
  )
}
