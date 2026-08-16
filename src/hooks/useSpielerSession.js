import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

// Meldet den Aufrufer bei Bedarf anonym an und löst den Zugangstoken
// (aus dem Link /#/s/{token}) zu spielerId + teamIds auf.
export function useSpielerSession(token) {
  const [ladt, setLadt] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [daten, setDaten] = useState(null)

  useEffect(() => {
    let aktiv = true
    setLadt(true)
    setFehler(null)
    setDaten(null)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!aktiv) return
      try {
        if (!user) {
          await signInAnonymously(auth)
          return // onAuthStateChanged feuert danach erneut mit dem neuen User
        }
        const snap = await getDoc(doc(db, 'zugang', token))
        if (!aktiv) return
        if (!snap.exists()) {
          setFehler('Dieser Link ist ungültig oder wurde deaktiviert.')
          setLadt(false)
          return
        }
        setDaten(snap.data())
        setLadt(false)
      } catch (err) {
        console.error('Zugang konnte nicht geladen werden:', err)
        if (aktiv) {
          setFehler('Der Link konnte nicht geprüft werden. Bitte erneut versuchen.')
          setLadt(false)
        }
      }
    })

    return () => {
      aktiv = false
      unsubscribe()
    }
  }, [token])

  return {
    ladt,
    fehler,
    spielerId: daten?.spielerId ?? null,
    teamIds: daten?.teamIds ?? [],
  }
}
