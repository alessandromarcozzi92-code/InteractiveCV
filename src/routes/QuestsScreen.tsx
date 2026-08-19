import { cv } from '../data/cv'
import type { Quest } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import { formatPeriod } from '../lib/format'
import styles from './screens.module.css'

type QuestsScreenProps = { quests?: Quest[] }

export function QuestsScreen({ quests = cv.quests }: QuestsScreenProps) {
  if (quests.length === 0) {
    return <Panel title="QUEST LOG">Nessuna quest registrata.</Panel>
  }

  return (
    <Panel title="QUEST LOG">
      <ul className={styles.list}>
        {quests.map((quest) => (
          <li key={quest.id} className={styles.group}>
            <h3>{quest.title}</h3>
            <div className={styles.meta}>
              <span>{quest.org}</span>
              <span>{formatPeriod(quest.from, quest.to)}</span>
            </div>
            <ul>
              {quest.achievements.map((achievement) => (
                <li key={achievement}>{achievement}</li>
              ))}
            </ul>
            <ul className={styles.tags}>
              {quest.tech.map((tech) => (
                <li key={tech} className={styles.tag}>
                  {tech}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
