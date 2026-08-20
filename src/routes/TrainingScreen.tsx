import { cv } from '../data/cv'
import type { Training } from '../data/cv'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type TrainingScreenProps = { training?: Training[] }

export function TrainingScreen({ training = cv.training }: TrainingScreenProps) {
  if (training.length === 0) {
    return (
      <>
        <ScreenHeader title="TRAINING GROUNDS" path="/training" />
        <Panel>Nessun tutorial completato.</Panel>
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="TRAINING GROUNDS" path="/training" />
      <Panel>
        <ul className={styles.list}>
          {training.map((entry) => (
            <li key={entry.id} className={styles.group}>
              <h3>{entry.title}</h3>
              <div className={styles.meta}>
                <span>{entry.org}</span>
                <span>{entry.year}</span>
              </div>
              {entry.note ? <p>{entry.note}</p> : null}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
