import { useTeamAuswahl } from '../context/TeamContext'
import Tabelle from '../features/tabelle/Tabelle'
import KeinTeam from '../components/KeinTeam'

function TabelleSeite() {
  const { teamId, team } = useTeamAuswahl()
  if (!teamId) return <KeinTeam />

  return (
    <div className="page">
      <h1>Tabelle</h1>
      {!team?.tabelle && (
        <p className="hint">
          Für diese Mannschaft liegt noch keine Tabelle vor. Sie wird bei der nächtlichen
          nuLiga-Synchronisation automatisch übernommen.
        </p>
      )}
      <Tabelle team={team} />
    </div>
  )
}

export default TabelleSeite
