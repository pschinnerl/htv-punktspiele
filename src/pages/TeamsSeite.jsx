import Teams from '../features/teams/Teams'
import { useTeamAuswahl } from '../context/TeamContext'

function TeamsSeite() {
  const { teamId, setTeamId } = useTeamAuswahl()

  return (
    <div className="page">
      <h1>Teams</h1>
      <p className="hint">
        Mannschaften werden normalerweise automatisch aus nuLiga übernommen. Von Hand
        angelegte Teams bleiben davon unberührt.
      </p>
      <Teams ausgewaehltesTeam={teamId} onAuswaehlen={setTeamId} />
    </div>
  )
}

export default TeamsSeite
