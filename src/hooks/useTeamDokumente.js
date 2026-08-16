import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Lädt einzelne Team-Dokumente anhand ihrer IDs. Wird in der Spieleransicht
// gebraucht: dort ist nur bekannt, zu welchen Teams der Token gehört – und
// die Firestore-Regeln erlauben Lesen von `teams` für jeden angemeldeten
// Nutzer, also auch für anonym angemeldete Spieler.
export function useTeamDokumente(teamIds) {
  const [teams, setTeams] = useState([])
  const schluessel = JSON.stringify(teamIds || [])

  useEffect(() => {
    const ids = JSON.parse(schluessel)
    if (!ids || ids.length === 0) {
      setTeams([])
      return undefined
    }

    const zwischenstand = new Map()
    const abmeldungen = ids.map((id) =>
      onSnapshot(
        doc(db, 'teams', id),
        (snap) => {
          if (snap.exists()) {
            zwischenstand.set(id, { id: snap.id, ...snap.data() })
          } else {
            zwischenstand.delete(id)
          }
          setTeams(ids.map((i) => zwischenstand.get(i)).filter(Boolean))
        },
        (err) => console.error('Team konnte nicht geladen werden:', err),
      ),
    )

    return () => abmeldungen.forEach((ab) => ab())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel])

  return { teams }
}
