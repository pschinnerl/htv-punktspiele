import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTeams } from '../hooks/useTeams'

const TeamContext = createContext(null)
const SPEICHER_SCHLUESSEL = 'htv-punktspiele:team'

// Hält das in der Seitenleiste gewählte Team fest. Die Auswahl gilt für alle
// Menüpunkte (Spieltage, Spieler, Tabelle) und übersteht einen Seitenwechsel
// oder Neuladen, damit man nicht ständig neu auswählen muss.
export function TeamProvider({ children }) {
  const { teams, loading } = useTeams()
  const [ausgewaehltesTeam, setAusgewaehltesTeam] = useState(() => {
    try {
      return window.localStorage.getItem(SPEICHER_SCHLUESSEL) || null
    } catch {
      return null
    }
  })

  // Gespeicherte Auswahl merken bzw. auf das erste Team zurückfallen, wenn
  // das gemerkte Team inzwischen gelöscht wurde.
  useEffect(() => {
    if (loading) return
    const gueltig = teams.some((t) => t.id === ausgewaehltesTeam)
    if (!gueltig) {
      setAusgewaehltesTeam(teams[0]?.id ?? null)
    }
  }, [loading, teams, ausgewaehltesTeam])

  useEffect(() => {
    try {
      if (ausgewaehltesTeam) {
        window.localStorage.setItem(SPEICHER_SCHLUESSEL, ausgewaehltesTeam)
      } else {
        window.localStorage.removeItem(SPEICHER_SCHLUESSEL)
      }
    } catch {
      // Privater Modus o.ä. – dann gilt die Auswahl eben nur für diese Sitzung.
    }
  }, [ausgewaehltesTeam])

  const wert = useMemo(
    () => ({
      teams,
      teamsLaden: loading,
      teamId: ausgewaehltesTeam,
      team: teams.find((t) => t.id === ausgewaehltesTeam) || null,
      setTeamId: setAusgewaehltesTeam,
    }),
    [teams, loading, ausgewaehltesTeam],
  )

  return <TeamContext.Provider value={wert}>{children}</TeamContext.Provider>
}

export function useTeamAuswahl() {
  const ctx = useContext(TeamContext)
  if (!ctx) {
    throw new Error('useTeamAuswahl muss innerhalb von <TeamProvider> verwendet werden')
  }
  return ctx
}
