import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Liefert die Verfügbarkeit aller Spieler zu einem Spieltag als Map
// spielerId -> { status, kommentar }. Nur für MF/Vorstand lesbar (siehe Regeln).
export function useVerfuegbarkeit(spieltagId) {
  const [karte, setKarte] = useState({})
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!spieltagId) {
      setKarte({})
      setLoading(false)
      return undefined
    }
    setLoading(true)
    setFehler(null)
    const ref = collection(db, 'spieltage', spieltagId, 'verfuegbarkeit')
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const neu = {}
        snap.docs.forEach((d) => {
          const data = d.data()
          if (data.spielerId) {
            neu[data.spielerId] = { status: data.status, kommentar: data.kommentar || '' }
          }
        })
        setKarte(neu)
        setLoading(false)
      },
      (err) => {
        console.error('Verfügbarkeit konnte nicht geladen werden:', err)
        setFehler('Verfügbarkeit konnte nicht geladen werden.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [spieltagId])

  return { karte, loading, fehler }
}
