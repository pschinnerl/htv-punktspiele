// Firebase-Initialisierung für die HTV-Punktspiele-App
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const db = getFirestore(app)
