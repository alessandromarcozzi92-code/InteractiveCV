import { Link } from 'react-router-dom'
import { Panel } from '../components/ui/Panel'

export function NotFoundScreen() {
  return (
    <Panel title="GAME OVER">
      <p>Questa schermata non esiste.</p>
      <Link to="/">Torna alla title screen</Link>
    </Panel>
  )
}
