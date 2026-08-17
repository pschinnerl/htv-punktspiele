import { useTeamAuswahl } from '../context/TeamContext'
import Spieltage from '../features/spieltage/Spieltage'
import KeinTeam from '../components/KeinTeam'

function SpieltageSeite() {
  const { teamId, team } = useTeamAuswahl()
  if (!teamId) return <KeinTeam />

  return (
    <div className="page">
      <h1>Spieltage</h1>
      <Spieltage teamId={teamId} teamName={team?.name} />
    </div>
  )
}

export default SpieltageSeite
