// Firebase-Initialisierung für die HTV-Punktspiele-App
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAfeVhbb8nmYhv-A9vXjEihulqfkluPBHo',
  authDomain: 'htv-punktspiele.firebaseapp.com',
  projectId: 'htv-punktspiele',
  storageBucket: 'htv-punktspiele.firebasestorage.app',
  messagingSenderId: '587927538077',
  appId: '1:587927538077:web:c681d4df81a83a8bce8774',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Offline-Zwischenspeicher: Zuletzt geladene Spieltage, Aufstellungen und
// Tabellen bleiben ohne Netz lesbar (z.B. in der Halle oder auf der
// Auswärtsfahrt), und Zu-/Absagen werden nachgereicht, sobald wieder
// Verbindung besteht. Fällt der Browser den Speicher nicht zu (privater
// Modus, alter Browser), arbeitet die App wie bisher rein online weiter.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
