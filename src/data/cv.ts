export type SkillCategory = 'lang' | 'framework' | 'tool' | 'soft'

export type Skill = {
  name: string
  level: number
  category: SkillCategory
}

/** `to` carries the literal 'NOW' for an ongoing role. */
export type Quest = {
  id: string
  title: string
  org: string
  from: string
  to: string
  achievements: string[]
  tech: string[]
}

export type Training = {
  id: string
  title: string
  org: string
  year: string
  note?: string
}

export type InventoryItem = {
  id: string
  name: string
  kind: 'language' | 'ability'
  detail: string
}

export type ProfileLink = { label: string; url: string }

export type Profile = {
  name: string
  class: string
  level: number
  location: string
  bio: string
  email: string
  links: ProfileLink[]
}

export type CV = {
  profile: Profile
  skills: Skill[]
  quests: Quest[]
  training: Training[]
  inventory: InventoryItem[]
}

export const cv: CV = {
  profile: {
    name: 'ALESSANDRO MARCOZZI',
    class: 'Frontend Engineer',
    level: 12,
    location: 'Italia · Remote',
    bio: 'Placeholder: due o tre righe di presentazione, sostituire con il testo reale.',
    email: 'alessandro.marcozzi92@gmail.com',
    links: [
      { label: 'GITHUB', url: 'https://github.com/' },
      { label: 'LINKEDIN', url: 'https://www.linkedin.com/' },
    ],
  },
  skills: [
    { name: 'JavaScript', level: 85, category: 'lang' },
    { name: 'TypeScript', level: 75, category: 'lang' },
    { name: 'CSS', level: 80, category: 'lang' },
    { name: 'React', level: 80, category: 'framework' },
    { name: 'Node.js', level: 60, category: 'framework' },
    { name: 'Git', level: 75, category: 'tool' },
    { name: 'Accessibility', level: 65, category: 'soft' },
  ],
  quests: [
    {
      id: 'quest-1',
      title: 'Placeholder Role',
      org: 'Placeholder Company',
      from: '2022',
      to: 'NOW',
      achievements: [
        'Placeholder: risultato misurabile numero uno.',
        'Placeholder: risultato misurabile numero due.',
      ],
      tech: ['React', 'TypeScript'],
    },
    {
      id: 'quest-2',
      title: 'Placeholder Previous Role',
      org: 'Placeholder Agency',
      from: '2019',
      to: '2022',
      achievements: ['Placeholder: risultato precedente.'],
      tech: ['JavaScript', 'CSS'],
    },
  ],
  training: [
    {
      id: 'training-1',
      title: 'Placeholder Degree',
      org: 'Placeholder University',
      year: '2018',
      note: 'Placeholder: nota facoltativa.',
    },
  ],
  inventory: [
    { id: 'inv-1', name: 'Italiano', kind: 'language', detail: 'Madrelingua' },
    { id: 'inv-2', name: 'Inglese', kind: 'language', detail: 'B2' },
    { id: 'inv-3', name: 'Code review', kind: 'ability', detail: 'Passive' },
  ],
}
