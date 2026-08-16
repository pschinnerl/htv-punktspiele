import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // user: aktueller Firebase-User (kann anonym sein, z.B. auf /s/{token})
  const [user, setUser] = useState(null)
  // rolle: Dokument aus rollen/{uid} für echte (nicht-anonyme) Logins
  const [rolle, setRolle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          const snap = await getDoc(doc(db, 'rollen', firebaseUser.uid))
          setRolle(snap.exists() ? snap.data() : null)
        } catch {
          setRolle(null)
        }
      } else {
        setRolle(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = (email, passwort) =>
    signInWithEmailAndPassword(auth, email, passwort)

  const logout = () => signOut(auth)

  const value = {
    user,
    rolle,
    loading,
    // "angemeldet" = echter Login per E-Mail/Passwort (nicht anonym)
    istAngemeldet: !!user && !user.isAnonymous,
    istVorstand: rolle?.rolle === 'vorstand',
    istMF:
      rolle?.rolle === 'mannschaftsfuehrer' || rolle?.rolle === 'vorstand',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden')
  }
  return ctx
}
