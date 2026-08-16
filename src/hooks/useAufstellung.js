import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Liefert die Aufstellung (Positionen) eines Spieltags.
export function useAufstellung(spieltagId) {
  const [positionen, setPositionen] = useState([])
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!spieltagId) {
      setPositionen([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setFehler(null)
    const ref = collection(db, 'spieltage', spieltagId, 'aufstellung')
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setPositionen(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Aufstellung konnte nicht geladen werden:', err)
        setFehler('Aufstellung konnte nicht geladen werden.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [spieltagId])

  return { positionen, loading, fehler }
}
