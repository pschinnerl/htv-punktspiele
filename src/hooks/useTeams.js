import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

// Liefert die Teams, die die aktuelle Rolle sehen darf:
// Vorstand -> alle Teams, Mannschaftsführer -> nur eigene teamIds.
export function useTeams() {
  const { istVorstand, rolle } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'teams'), orderBy('name'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const alle = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const sichtbar = istVorstand
          ? alle
          : alle.filter((t) => (rolle?.teamIds || []).includes(t.id))
        setTeams(sichtbar)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [istVorstand, rolle])

  return { teams, loading }
}
