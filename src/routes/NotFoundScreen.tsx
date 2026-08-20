import { Link } from 'react-router-dom'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Panel } from '../components/ui/Panel'

export function NotFoundScreen() {
  return (
    <>
      <ScreenHeader title="GAME OVER" path="/nope" />
      <Panel>
        <p>Questa schermata non esiste.</p>
        <Link to="/">Torna alla title screen</Link>
      </Panel>
    </>
  )
}
