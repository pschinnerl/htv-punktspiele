import { useParams } from 'react-router-dom'
import { useSpielerSession } from '../hooks/useSpielerSession'
import { useSpieltageFuerTeams } from '../hooks/useSpieltageFuerTeams'
import { useTeamDokumente } from '../hooks/useTeamDokumente'
import SpieltagKarte from '../features/spieler-ansicht/SpieltagKarte'
import Tabelle from '../features/tabelle/Tabelle'

function Spieler() {
  const { token } = useParams()
  const { ladt, fehler, spielerId, teamIds } = useSpielerSession(token)
  const { spieltage, loading, fehler: spieltageFehler } = useSpieltageFuerTeams(teamIds)
  const { teams } = useTeamDokumente(teamIds)

  if (ladt) {
    return (
      <div className="page page--spieler">
        <p className="hint">Lade …</p>
      </div>
    )
  }

  if (fehler) {
    return (
      <div className="page page--spieler">
        <h1>Nicht gefunden</h1>
        <p>{fehler}</p>
      </div>
    )
  }

  return (
    <div className="page page--spieler">
      <h1>Meine Spieltage</h1>

      {loading && <p className="hint">Lade Spieltage …</p>}
      {spieltageFehler && <p className="form-error">{spieltageFehler}</p>}
      {!loading && !spieltageFehler && spieltage.length === 0 && (
        <p className="hint">Aktuell sind keine Spieltage geplant.</p>
      )}

      <div className="spieltag-karten">
        {spieltage.map((s) => (
          <SpieltagKarte key={s.id} spieltag={s} token={token} spielerId={spielerId} />
        ))}
      </div>

      {teams.map((team) => (
        <Tabelle key={team.id} team={team} kompakt />
      ))}
    </div>
  )
}

export default Spieler
