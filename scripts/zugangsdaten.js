// Gemeinsame Zugangsdaten-Ermittlung für die Hilfsskripte (nuLiga-Synchronisation
// und Sicherung).
//
// Die Zugangsdaten kommen entweder aus Umgebungsvariablen (so liefert GitHub
// Actions die Secrets) oder – für den Aufruf von Hand – aus der lokalen Datei
// scripts/zugang.local. Die Endung ".local" ist in .gitignore ausgeschlossen,
// die Datei landet also nicht im öffentlichen Repository.

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function zugangsdatenLesen() {
  let email = process.env.FIREBASE_SYNC_EMAIL
  let passwort = process.env.FIREBASE_SYNC_PASSWORD
  if (email && passwort) return { email, passwort, quelle: 'Umgebungsvariablen' }

  const pfad = join(__dirname, 'zugang.local')
  if (existsSync(pfad)) {
    for (const zeile of readFileSync(pfad, 'utf-8').split('\n')) {
      const treffer = zeile.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
      if (!treffer) continue
      const wert = treffer[2].replace(/^["']|["']$/g, '')
      if (treffer[1] === 'FIREBASE_SYNC_EMAIL') email = email || wert
      if (treffer[1] === 'FIREBASE_SYNC_PASSWORD') passwort = passwort || wert
    }
    if (email && passwort) return { email, passwort, quelle: pfad }
  }

  throw new Error(
    'Keine Zugangsdaten gefunden.\n' +
      'Entweder scripts/zugang.local anlegen mit den beiden Zeilen:\n' +
      '  FIREBASE_SYNC_EMAIL=deine@mail.de\n' +
      '  FIREBASE_SYNC_PASSWORD=deinPasswort\n' +
      'oder die Variablen beim Aufruf voranstellen:\n' +
      '  FIREBASE_SYNC_EMAIL="…" FIREBASE_SYNC_PASSWORD="…" npm run sync:nuliga',
  )
}
