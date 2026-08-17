import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Liefert alle Rollen-Dokumente. Nur der Vorstand darf die Sammlung auflisten
// (siehe firestore.rules), deshalb wird dieser Hook nur auf der Zugänge-Seite
// verwendet.
export function useRollen() {
  const [rollen, setRollen] = useState([])
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'rollen'),
      (snap) => {
        setRollen(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.email || a.id).localeCompare(b.email || b.id)),
        )
        setLoading(false)
      },
      (err) => {
        console.error('Zugänge konnten nicht geladen werden:', err)
        setFehler(
          'Die Zugänge konnten nicht geladen werden. Sind die aktualisierten ' +
            'Firestore-Regeln schon veröffentlicht?',
        )
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { rollen, loading, fehler }
}
