import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

// Liefert alle Spieltage eines Teams, sortiert nach Datum.
// Sortierung passiert im Client (nicht per orderBy in der Query), um auf
// Nummer sicher zu gehen: die Kombination aus Filter + orderBy auf einem
// anderen Feld hat in der Praxis einen Composite-Index verlangt (siehe auch
// die array-contains-Fälle bei Spielern und Spieltagen für Spieler-Links).
export function useSpieltage(teamId) {
  const [spieltage, setSpieltage] = useState([])
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!teamId) {
      setSpieltage([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setFehler(null)
    const q = query(collection(db, 'spieltage'), where('teamId', '==', teamId))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const liste = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.datum || '').localeCompare(b.datum || ''))
        setSpieltage(liste)
        setLoading(false)
      },
      (err) => {
        console.error('Spieltage konnten nicht geladen werden:', err)
        setFehler('Spieltage konnten nicht geladen werden.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [teamId])

  return { spieltage, loading, fehler }
}
