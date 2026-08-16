import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Teams from '../features/teams/Teams'
import Spieler from '../features/spieler/Spieler'
import Spieltage from '../features/spieltage/Spieltage'
import Tabelle from '../features/tabelle/Tabelle'
import { useTeams } from '../hooks/useTeams'

function VerwaltungInhalt() {
  const { user, istVorstand, logout } = useAuth()
  const { teams } = useTeams()
  const [ausgewaehltesTeam, setAusgewaehltesTeam] = useState(null)

  const team = teams.find((t) => t.id === ausgewaehltesTeam)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Verwaltung</h1>
          <p className="hint">
            Angemeldet als {user.email} ({istVorstand ? 'Vorstand' : 'Mannschaftsführer'})
          </p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={logout}>
          Abmelden
        </button>
      </div>

      <Teams
        ausgewaehltesTeam={ausgewaehltesTeam}
        onAuswaehlen={setAusgewaehltesTeam}
      />

      {ausgewaehltesTeam && (
        <>
          <Spieltage teamId={ausgewaehltesTeam} teamName={team?.name} />
          <Spieler teamId={ausgewaehltesTeam} teamName={team?.name} />
          <Tabelle team={team} />
        </>
      )}
    </div>
  )
}

function Verwaltung() {
  return (
    <ProtectedRoute>
      <VerwaltungInhalt />
    </ProtectedRoute>
  )
}

export default Verwaltung
