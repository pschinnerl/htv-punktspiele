import { useTeamAuswahl } from '../context/TeamContext'
import Spieler from '../features/spieler/Spieler'
import KeinTeam from '../components/KeinTeam'

function SpielerVerwaltung() {
  const { teamId, team } = useTeamAuswahl()
  if (!teamId) return <KeinTeam />

  return (
    <div className="page">
      <h1>Spieler</h1>
      <p className="hint">
        Jeder Spieler bekommt einen persönlichen Link. Über diesen Link sagt er zu oder ab –
        ohne Anmeldung und ohne App-Installation.
      </p>
      <Spieler teamId={teamId} teamName={team?.name} />
    </div>
  )
}

export default SpielerVerwaltung
