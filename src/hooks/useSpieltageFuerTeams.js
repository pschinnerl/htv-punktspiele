import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

// Liefert alle Spieltage für eine Liste von Team-IDs (max. 30, Firestore-Limit
// für 'in'-Abfragen – für den HTV-Punktspiele-Umfang mehr als ausreichend).
// Sortierung passiert im Client (nicht per orderBy in der Query), weil die
// Kombination aus 'in'-Filter und orderBy auf einem anderen Feld in
// Firestore einen zusätzlichen Composite-Index erfordern würde.
export function useSpieltageFuerTeams(teamIds) {
  const [spieltage, setSpieltage] = useState([])
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)
  const schluessel = JSON.stringify(teamIds || [])

  useEffect(() => {
    const ids = JSON.parse(schluessel)
    if (!ids || ids.length === 0) {
      setSpieltage([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setFehler(null)
    const q = query(collection(db, 'spieltage'), where('teamId', 'in', ids.slice(0, 30)))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel])

  return { spieltage, loading, fehler }
}
