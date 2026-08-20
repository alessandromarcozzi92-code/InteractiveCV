import { cv } from '../data/cv'
import type { Profile } from '../data/cv'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type StatsScreenProps = { profile?: Profile }

export function StatsScreen({ profile = cv.profile }: StatsScreenProps) {
  const rows = [
    { key: 'CLASS', value: profile.class },
    { key: 'LEVEL', value: String(profile.level) },
    { key: 'LOCATION', value: profile.location },
    { key: 'EMAIL', value: profile.email },
  ]

  return (
    <>
      <ScreenHeader title="PLAYER PROFILE" path="/stats" />
      <Panel>
        <dl className={styles.rows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.key}>
              <dt className={styles.key}>{row.key}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p>{profile.bio}</p>
      </Panel>
    </>
  )
}
