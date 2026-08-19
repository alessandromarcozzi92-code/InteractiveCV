import { Route, Routes } from 'react-router-dom'
import { ArcadeShell } from '../components/layout/ArcadeShell'
import { TitleScreen } from './TitleScreen'
import { StatsScreen } from './StatsScreen'
import { SkillsScreen } from './SkillsScreen'
import { QuestsScreen } from './QuestsScreen'
import { TrainingScreen } from './TrainingScreen'
import { InventoryScreen } from './InventoryScreen'
import { ContactScreen } from './ContactScreen'
import { NotFoundScreen } from './NotFoundScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route element={<ArcadeShell />}>
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/skills" element={<SkillsScreen />} />
        <Route path="/quests" element={<QuestsScreen />} />
        <Route path="/training" element={<TrainingScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/contact" element={<ContactScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
