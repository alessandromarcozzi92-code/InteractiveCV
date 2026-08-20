import { cv } from '../data/cv'
import type { InventoryItem } from '../data/cv'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type InventoryScreenProps = { items?: InventoryItem[] }

export function InventoryScreen({ items = cv.inventory }: InventoryScreenProps) {
  const languages = items.filter((item) => item.kind === 'language')
  const abilities = items.filter((item) => item.kind === 'ability')

  return (
    <>
      <ScreenHeader title="INVENTORY" path="/inventory" />
      <Panel>
        {[
          { title: 'LANGUAGES', entries: languages },
          { title: 'PASSIVE ABILITIES', entries: abilities },
        ]
          .filter((group) => group.entries.length > 0)
          .map((group) => (
            <section className={styles.group} key={group.title}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <dl className={styles.rows}>
                {group.entries.map((entry) => (
                  <div className={styles.row} key={entry.id}>
                    <dt className={styles.key}>{entry.name}</dt>
                    <dd className={styles.value}>{entry.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
      </Panel>
    </>
  )
}
