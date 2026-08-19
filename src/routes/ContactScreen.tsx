import { cv } from '../data/cv'
import type { Profile } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import { PixelButton } from '../components/ui/PixelButton'
import styles from './screens.module.css'

/*
 * Built from BASE_URL, not hardcoded to '/cv.pdf': under GitHub Pages the
 * site is served from a subpath and an absolute '/cv.pdf' would 404.
 */
const CV_FILE_URL = `${import.meta.env.BASE_URL}cv.pdf`

type ContactScreenProps = { profile?: Profile }

export function ContactScreen({ profile = cv.profile }: ContactScreenProps) {
  return (
    <Panel title="CONTACT">
      <p>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <ul className={styles.tags}>
        {profile.links.map((link) => (
          <li key={link.url} className={styles.tag}>
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <PixelButton href={CV_FILE_URL} download>
        SAVE GAME
      </PixelButton>
    </Panel>
  )
}
