import { cv } from '../data/cv'
import type { Skill, SkillCategory } from '../data/cv'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Panel } from '../components/ui/Panel'
import { StatBar } from '../components/ui/StatBar'
import styles from './screens.module.css'

const CATEGORY_ORDER: SkillCategory[] = ['lang', 'framework', 'tool', 'soft']

type SkillsScreenProps = { skills?: Skill[] }

export function SkillsScreen({ skills = cv.skills }: SkillsScreenProps) {
  return (
    <>
      <ScreenHeader title="SKILL TREE" path="/skills" />
      <Panel>
        {CATEGORY_ORDER.map((category) => {
          const group = skills.filter((skill) => skill.category === category)
          if (group.length === 0) return null

          return (
            <section className={styles.group} key={category}>
              <h3 className={styles.groupTitle}>{category.toUpperCase()}</h3>
              {group.map((skill) => (
                <StatBar key={skill.name} label={skill.name} level={skill.level} />
              ))}
            </section>
          )
        })}
      </Panel>
    </>
  )
}
