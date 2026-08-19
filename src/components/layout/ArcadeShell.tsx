import { Link, Outlet } from 'react-router-dom'
import { cv } from '../../data/cv'
import { NavMenu } from './NavMenu'
import styles from './ArcadeShell.module.css'

export function ArcadeShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.skip} href="#screen">
          Vai al contenuto
        </a>
        <h1 className={styles.brand}>
          <Link to="/">{cv.profile.name}</Link>
        </h1>
        <NavMenu />
      </header>
      <main id="screen">
        <Outlet />
      </main>
    </div>
  )
}
