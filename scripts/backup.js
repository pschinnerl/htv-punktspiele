// Sichert den kompletten Datenbestand der Punktspiele-App als JSON-Datei.
//
// Läuft wie die nuLiga-Synchronisation als einfaches Node-Skript (z.B. wöchentlich
// per GitHub Actions) und meldet sich dafür ganz normal mit einem Vorstands-Konto
// an – kein Admin-SDK, kein Service-Account-Key, kein Blaze-Plan nötig. Es gelten
// also exakt dieselben Firestore-Regeln wie in der App.
//
// Aufruf von Hand:
//   npm run backup
// Ergebnis: backup/htv-punktspiele-JJJJ-MM-TT.json
//
// Zum Wiederherstellen einzelner Einträge genügt die Firebase Console: Die JSON-
// Datei enthält je Dokument den vollständigen Pfad und alle Felder.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, getFirestore } from 'firebase/firestore'
import { zugangsdatenLesen } from './zugangsdaten.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const firebaseConfig = {
  apiKey: 'AIzaSyAfeVhbb8nmYhv-A9vXjEihulqfkluPBHo',
  authDomain: 'htv-punktspiele.firebaseapp.com',
  projectId: 'htv-punktspiele',
  storageBucket: 'htv-punktspiele.firebasestorage.app',
  messagingSenderId: '587927538077',
  appId: '1:587927538077:web:c681d4df81a83a8bce8774',
}

// Sammlungen der obersten Ebene. `zugang` enthält die geheimen Spieler-Tokens –
// die Sicherung gehört deshalb NICHT in ein öffentliches Repository (siehe
// .gitignore und die private Ablage des GitHub-Artefakts).
const SAMMLUNGEN = ['teams', 'spieler', 'spieltage', 'zugang', 'rollen']

// Unter-Sammlungen je Spieltag.
const UNTERSAMMLUNGEN = ['verfuegbarkeit', 'aufstellung']

function heuteIso() {
  const jetzt = new Date()
  const monat = String(jetzt.getMonth() + 1).padStart(2, '0')
  const tag = String(jetzt.getDate()).padStart(2, '0')
  return `${jetzt.getFullYear()}-${monat}-${tag}`
}

// Firestore-Zeitstempel u.ä. in etwas Verwandeln, das sich als JSON schreiben lässt.
function jsonTauglich(wert) {
  if (wert === null || typeof wert !== 'object') return wert
  if (typeof wert.toDate === 'function') return wert.toDate().toISOString()
  if (Array.isArray(wert)) return wert.map(jsonTauglich)
  const ergebnis = {}
  for (const [schluessel, inhalt] of Object.entries(wert)) {
    ergebnis[schluessel] = jsonTauglich(inhalt)
  }
  return ergebnis
}

async function sammlungLesen(db, pfad) {
  const snap = await getDocs(collection(db, ...pfad.split('/')))
  return snap.docs.map((d) => ({ pfad: `${pfad}/${d.id}`, id: d.id, daten: jsonTauglich(d.data()) }))
}

async function main() {
  const { email, passwort, quelle } = zugangsdatenLesen()
  console.log(`Zugangsdaten aus: ${quelle}`)

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  await signInWithEmailAndPassword(auth, email, passwort)
  console.log(`Angemeldet als ${email}.`)

  const sicherung = {
    erstellt: new Date().toISOString(),
    projekt: firebaseConfig.projectId,
    dokumente: {},
  }

  for (const name of SAMMLUNGEN) {
    try {
      const eintraege = await sammlungLesen(db, name)
      sicherung.dokumente[name] = eintraege
      console.log(`  ${name}: ${eintraege.length} Dokument(e)`)
    } catch (err) {
      // `rollen` kann nur der Vorstand auflisten – mit einem Mannschaftsführer-
      // Konto fehlt dieser Teil, ohne dass die ganze Sicherung scheitert.
      console.warn(`  ${name}: übersprungen (${err.message})`)
      sicherung.dokumente[name] = []
    }
  }

  for (const spieltag of sicherung.dokumente.spieltage || []) {
    for (const unter of UNTERSAMMLUNGEN) {
      try {
        const eintraege = await sammlungLesen(db, `spieltage/${spieltag.id}/${unter}`)
        if (eintraege.length > 0) {
          sicherung.dokumente[`spieltage/${unter}`] = [
            ...(sicherung.dokumente[`spieltage/${unter}`] || []),
            ...eintraege,
          ]
        }
      } catch (err) {
        console.warn(`  ${spieltag.pfad}/${unter}: übersprungen (${err.message})`)
      }
    }
  }

  const ordner = join(__dirname, '..', 'backup')
  mkdirSync(ordner, { recursive: true })
  const datei = join(ordner, `htv-punktspiele-${heuteIso()}.json`)
  writeFileSync(datei, JSON.stringify(sicherung, null, 2), 'utf-8')

  const gesamt = Object.values(sicherung.dokumente).reduce((s, l) => s + l.length, 0)
  console.log(`\nSicherung geschrieben: ${datei} (${gesamt} Dokumente).`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSicherung fehlgeschlagen:', err.message)
    process.exit(1)
  })
