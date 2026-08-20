import { Moon } from './Moon'
import { Sky } from './Sky'
import { Skyline } from './Skyline'
import { Stars } from './Stars'
import styles from './Scenery.module.css'

type SceneryProps = {
  /**
   * `full` on the title screen: tall skyline, bright stars.
   * `muted` behind content: the scene must never compete with text.
   */
  intensity?: 'full' | 'muted'
}

export function Scenery({ intensity = 'muted' }: SceneryProps) {
  return (
    <div className={styles.scenery} data-intensity={intensity} aria-hidden="true">
      <Sky />
      <Stars />
      <Moon />
      <Skyline plane="far" />
      <Skyline plane="near" />
    </div>
  )
}
