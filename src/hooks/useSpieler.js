import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { nachRang } from '../lib/spieler'

// Liefert alle Spieler eines Teams, sortiert nach Meldelisten-Rang.
// Hinweis: Die Sortierung passiert bewusst im Client (nicht per orderBy in
// der Firestore-Query), weil die Kombination aus array-contains-Filter und
// orderBy auf einem anderen Feld einen zusätzlichen Composite-Index in
// Firestore erfordern würde – und weil der Rang teamabhängig sein kann.
export function useSpieler(teamId) {
  const [spieler, setSpieler] = useState([])
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!teamId) {
      setSpieler([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setFehler(null)
    const q = query(collection(db, 'spieler'), where('teamIds', 'array-contains', teamId))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const liste = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(nachRang(teamId))
        setSpieler(liste)
        setLoading(false)
      },
      (err) => {
        console.error('Spieler konnten nicht geladen werden:', err)
        setFehler('Spieler konnten nicht geladen werden.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [teamId])

  return { spieler, loading, fehler }
}
