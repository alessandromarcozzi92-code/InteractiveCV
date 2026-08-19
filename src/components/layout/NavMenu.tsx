import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MENU_ITEMS } from '../../data/menu'
import { useMenuNavigation } from '../../hooks/useMenuNavigation'
import styles from './NavMenu.module.css'

const MENU_LABEL = 'Sezioni del CV'

export function NavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeIndex = MENU_ITEMS.findIndex((item) => item.path === location.pathname)

  const { activeIndex, setActiveIndex, handleKeyDown } = useMenuNavigation({
    itemCount: MENU_ITEMS.length,
    initialIndex: routeIndex < 0 ? 0 : routeIndex,
    onActivate: (index) => navigate(MENU_ITEMS[index].path),
    onCancel: () => navigate('/'),
  })

  return (
    /*
     * The nav itself is the arrow-key surface: focusing it drives the cursor
     * without tabbing through every entry first. Entries stay plain links, so
     * they keep the link role, Tab order, open-in-new-tab and indexability.
     */
    <nav
      aria-label={MENU_LABEL}
      className={styles.nav}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <ul className={styles.menu}>
        {MENU_ITEMS.map((item, index) => (
          <li key={item.path}>
            <Link
              className={styles.link}
              to={item.path}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <span className={styles.cursorSlot} aria-hidden="true">
                {index === activeIndex ? <span className={styles.cursor}>▸</span> : null}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
