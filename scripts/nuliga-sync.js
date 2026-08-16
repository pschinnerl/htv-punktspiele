// Synchronisiert Mannschaften, Spieltage, Meldelisten und Ligatabellen aus den
// öffentlichen nuLiga-Seiten (tnb.liga.nu o.ä.) nach Firestore. Läuft als
// Node-Skript, z.B. per GitHub Actions – NICHT über Firebase Cloud Functions
// (Spark-Plan-Vorgabe).
//
// Anmeldung erfolgt ganz normal über das Firebase-Auth-SDK mit einem
// bestehenden Vorstands-/MF-Konto (E-Mail+Passwort aus Umgebungsvariablen),
// nicht über einen Admin-SDK-Service-Account-Key. Dadurch gelten exakt die
// gleichen Firestore-Regeln wie in der App selbst – keine Sonderrechte.
//
// Nötige Umgebungsvariablen:
//   FIREBASE_SYNC_EMAIL, FIREBASE_SYNC_PASSWORD
//
// Konfiguration: scripts/nuliga-config.json

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  writeBatch,
} from 'firebase/firestore'
import {
  parseVereinsseite,
  parseGruppenLink,
  parseSpielplanHtml,
  parseMeldeliste,
  parseTabelle,
  normalisiereTeamName,
  namensSchluessel,
} from './nuliga-parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Gleiche, öffentliche Firebase-Konfiguration wie in src/firebase.js.
const firebaseConfig = {
  apiKey: 'AIzaSyAfeVhbb8nmYhv-A9vXjEihulqfkluPBHo',
  authDomain: 'htv-punktspiele.firebaseapp.com',
  projectId: 'htv-punktspiele',
  storageBucket: 'htv-punktspiele.firebasestorage.app',
  messagingSenderId: '587927538077',
  appId: '1:587927538077:web:c681d4df81a83a8bce8774',
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9',
}

// Zeichensatz ohne leicht verwechselbare Zeichen – identisch zu src/lib/token.js
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function erzeugeToken(laenge = 24) {
  const zufall = new Uint32Array(laenge)
  globalThis.crypto.getRandomValues(zufall)
  return Array.from(zufall, (n) => TOKEN_CHARS[n % TOKEN_CHARS.length]).join('')
}

async function htmlLaden(url) {
  const antwort = await fetch(url, { headers: BROWSER_HEADERS })
  const inhalt = await antwort.text()
  if (!antwort.ok) {
    throw new Error(`Seite nicht erreichbar (${antwort.status}): ${url}`)
  }
  if (inhalt.startsWith('%PDF-')) {
    throw new Error(
      'Die URL liefert ein PDF statt HTML (z.B. ein "...FOP"-Dokumentlink). ' +
        'Bitte eine HTML-Seite verwenden (teamPortrait oder groupPage).',
    )
  }
  return inhalt
}

function debugSchreiben(html, name) {
  const sicher = (name || 'seite').replace(/[^\w.-]+/g, '_')
  const pfad = join(__dirname, `debug-nuliga-${sicher}.html`)
  writeFileSync(pfad, html, 'utf-8')
  console.error(`     (Antwort zur Fehlersuche gespeichert: ${pfad}, ${html.length} Zeichen)`)
}

// ---------------------------------------------------------------------------
// Firestore-Hilfen
// ---------------------------------------------------------------------------

async function alleLaden(db, sammlung) {
  const snap = await getDocs(collection(db, sammlung))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function teamSicherstellen(db, vorhandene, mannschaft, teamsAnlegen) {
  const gesucht = normalisiereTeamName(mannschaft.name).toLowerCase()
  const treffer = vorhandene.find(
    (t) => normalisiereTeamName(t.name || '').toLowerCase() === gesucht,
  )

  if (treffer) {
    // Vorhandenes Team nicht überschreiben (Name/Liga/Saison können bewusst
    // abweichend gepflegt sein) – nur die nuLiga-Herkunft ergänzen.
    await setDoc(
      doc(db, 'teams', treffer.id),
      { nuligaUrl: mannschaft.url, nuligaName: mannschaft.nuligaName },
      { merge: true },
    )
    return { id: treffer.id, neu: false }
  }

  if (!teamsAnlegen) return null

  const ref = doc(collection(db, 'teams'))
  await setDoc(ref, {
    name: mannschaft.name,
    liga: mannschaft.liga,
    saison: mannschaft.saison,
    nuligaUrl: mannschaft.url,
    nuligaName: mannschaft.nuligaName,
    quelle: 'nuliga',
  })
  vorhandene.push({ id: ref.id, name: mannschaft.name })
  return { id: ref.id, neu: true }
}

// Führt die Begegnungen aus Mannschafts- und Ligaseite zusammen. Bei
// doppelten Einträgen gewinnt der informativere (mit Ergebnis bzw. Uhrzeit).
export function spieleZusammenfuehren(...listen) {
  const zusammen = new Map()

  for (const liste of listen) {
    for (const spiel of liste) {
      const schluessel = `${spiel.datum}|${spiel.gegner.toLowerCase()}`
      const vorhanden = zusammen.get(schluessel)
      if (!vorhanden) {
        zusammen.set(schluessel, spiel)
        continue
      }
      const besser =
        (spiel.ergebnisNuliga ? 2 : 0) + (spiel.uhrzeitFehlt ? 0 : 1) >
        (vorhanden.ergebnisNuliga ? 2 : 0) + (vorhanden.uhrzeitFehlt ? 0 : 1)
      if (besser) zusammen.set(schluessel, spiel)
    }
  }

  return [...zusammen.values()].sort((a, b) => a.datum.localeCompare(b.datum))
}

// Entfernt nuLiga-Spieltage des Teams, die im aktuellen Abruf nicht mehr
// vorkommen – etwa weil eine Begegnung auf einen anderen Termin verlegt
// wurde. Von Hand angelegte Spieltage (ohne quelle: 'nuliga') bleiben.
async function veralteteSpieltageEntfernen(db, teamId, aktuelleIds) {
  const behalten = new Set(aktuelleIds)
  const snap = await getDocs(
    query(collection(db, 'spieltage'), where('teamId', '==', teamId)),
  )

  let entfernt = 0
  for (const eintrag of snap.docs) {
    if (behalten.has(eintrag.id)) continue
    if (eintrag.data().quelle !== 'nuliga') continue
    if (!eintrag.id.startsWith(`nuliga-${teamId}-`)) continue
    await deleteDoc(doc(db, 'spieltage', eintrag.id))
    entfernt += 1
  }
  return entfernt
}

async function spieltagSchreiben(db, teamId, spiel) {
  const docId = `nuliga-${teamId}-${spiel.datum}`
  await setDoc(
    doc(db, 'spieltage', docId),
    {
      teamId,
      datum: spiel.datum,
      uhrzeit: spiel.uhrzeit,
      heimAuswaerts: spiel.heimAuswaerts,
      gegner: spiel.gegner,
      status: spiel.status,
      quelle: 'nuliga',
      ergebnisNuliga: spiel.ergebnisNuliga,
    },
    { merge: true },
  )
  return docId
}

// Legt fehlende Spieler an bzw. aktualisiert Rang und Leistungsklasse.
// Ein Spieler kann in mehreren Mannschaften gemeldet sein und hat dort
// unterschiedliche Meldelisten-Ränge – deshalb wird der Rang zusätzlich
// pro Team in `meldelisteRaenge` abgelegt. Ein bereits vergebener
// Zugangs-Token bleibt dabei immer unangetastet, damit verschickte
// Spieler-Links gültig bleiben.
async function spielerSynchronisieren(db, teamId, meldeliste, cache, spielerAnlegen) {
  let angelegt = 0
  let aktualisiert = 0

  for (const eintrag of meldeliste) {
    const schluessel = namensSchluessel(eintrag.name)
    const vorhanden = cache.find((s) => namensSchluessel(s.name || '') === schluessel)

    if (vorhanden) {
      const aenderungen = {
        [`meldelisteRaenge.${teamId}`]: eintrag.meldelisteRang,
        teamIds: arrayUnion(teamId),
      }
      if (eintrag.lk && vorhanden.lk !== eintrag.lk) aenderungen.lk = eintrag.lk
      // Spieler nur in einer Mannschaft: auch das Hauptfeld mitführen, damit
      // manuell gepflegte Daten und die App-Anzeige konsistent bleiben.
      if (!vorhanden.teamIds || vorhanden.teamIds.every((t) => t === teamId)) {
        aenderungen.meldelisteRang = eintrag.meldelisteRang
      }

      await updateDoc(doc(db, 'spieler', vorhanden.id), aenderungen)

      if (vorhanden.zugangsToken) {
        await updateDoc(doc(db, 'zugang', vorhanden.zugangsToken), {
          teamIds: arrayUnion(teamId),
        })
      }

      vorhanden.teamIds = [...new Set([...(vorhanden.teamIds || []), teamId])]
      aktualisiert += 1
      continue
    }

    if (!spielerAnlegen) continue

    const token = erzeugeToken()
    const spielerRef = doc(collection(db, 'spieler'))
    const batch = writeBatch(db)
    batch.set(spielerRef, {
      name: eintrag.name,
      meldelisteRang: eintrag.meldelisteRang,
      meldelisteRaenge: { [teamId]: eintrag.meldelisteRang },
      lk: eintrag.lk,
      teamIds: [teamId],
      zugangsToken: token,
      quelle: 'nuliga',
    })
    batch.set(doc(db, 'zugang', token), { spielerId: spielerRef.id, teamIds: [teamId] })
    await batch.commit()

    cache.push({
      id: spielerRef.id,
      name: eintrag.name,
      teamIds: [teamId],
      zugangsToken: token,
      lk: eintrag.lk,
    })
    angelegt += 1
  }

  return { angelegt, aktualisiert }
}

// ---------------------------------------------------------------------------

// Zugangsdaten kommen entweder aus Umgebungsvariablen (so liefert GitHub
// Actions die Secrets) oder – für den Aufruf von Hand – aus der lokalen
// Datei scripts/zugang.local. Die Endung ".local" ist in .gitignore
// ausgeschlossen, die Datei landet also nicht im öffentlichen Repository.
function zugangsdatenLesen() {
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

async function main() {
  const { email, passwort, quelle } = zugangsdatenLesen()
  console.log(`Zugangsdaten aus: ${quelle}`)

  const konfig = JSON.parse(readFileSync(join(__dirname, 'nuliga-config.json'), 'utf-8'))
  const {
    vereinsSuchtext,
    vereinsseite,
    saisonFilter = '',
    teamsAnlegen = true,
    spielerAnlegen = true,
    tabelleUebernehmen = true,
    nurDieseTeams = [],
    ausgeschlosseneTeams = [],
  } = konfig

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  await signInWithEmailAndPassword(auth, email, passwort)
  console.log(`Angemeldet als ${email}.`)

  console.log(`\nLese Vereinsseite: ${vereinsseite}`)
  const vereinsHtml = await htmlLaden(vereinsseite)
  let mannschaften = parseVereinsseite(vereinsHtml, vereinsseite)
  console.log(`${mannschaften.length} Mannschaft(en) auf der Vereinsseite gefunden.`)
  if (mannschaften.length === 0) debugSchreiben(vereinsHtml, 'vereinsseite')

  if (saisonFilter) {
    mannschaften = mannschaften.filter((m) =>
      m.saison.toLowerCase().includes(saisonFilter.toLowerCase()),
    )
    console.log(`${mannschaften.length} davon passen zum Saisonfilter "${saisonFilter}".`)
  }
  if (nurDieseTeams.length > 0) {
    const erlaubt = nurDieseTeams.map((n) => n.toLowerCase())
    mannschaften = mannschaften.filter((m) => erlaubt.includes(m.name.toLowerCase()))
  }
  if (ausgeschlosseneTeams.length > 0) {
    const gesperrt = ausgeschlosseneTeams.map((n) => n.toLowerCase())
    mannschaften = mannschaften.filter((m) => !gesperrt.includes(m.name.toLowerCase()))
  }

  const teamCache = await alleLaden(db, 'teams')
  const spielerCache = await alleLaden(db, 'spieler')

  const bilanz = {
    teamsNeu: 0,
    spieltage: 0,
    spielerNeu: 0,
    spielerAktualisiert: 0,
    tabellen: 0,
  }

  for (const mannschaft of mannschaften) {
    console.log(`\n--- ${mannschaft.name} (${mannschaft.liga || 'ohne Liga-Angabe'}) ---`)

    let team
    try {
      team = await teamSicherstellen(db, teamCache, mannschaft, teamsAnlegen)
    } catch (err) {
      console.error(`  Team konnte nicht angelegt/aktualisiert werden: ${err.message}`)
      continue
    }
    if (!team) {
      console.warn('  Kein passendes Team in der App und Anlegen ist deaktiviert – übersprungen.')
      continue
    }
    if (team.neu) {
      bilanz.teamsNeu += 1
      console.log('  Team in der App neu angelegt.')
    }

    let html
    try {
      html = await htmlLaden(mannschaft.url)
    } catch (err) {
      console.error(`  Mannschaftsseite konnte nicht geladen werden: ${err.message}`)
      continue
    }

    // Die Gruppen-/Ligaseite wird für die Tabelle gebraucht – und liefert
    // zusätzlich den vollständigen Begegnungsplan der Liga. Beide Quellen
    // ergänzen sich: die Mannschaftsseite kennt verlegte und kommende Spiele
    // mit neuem Termin, die Gruppenseite die bereits gespielten.
    const gruppe = parseGruppenLink(html, mannschaft.url)
    let gruppenHtml = null
    if (gruppe) {
      try {
        gruppenHtml = await htmlLaden(gruppe.url)
      } catch (err) {
        console.error(`  Ligaseite konnte nicht geladen werden: ${err.message}`)
      }
    } else {
      console.warn('  Kein Link zur Ligaseite auf der Mannschaftsseite gefunden.')
    }

    // --- Spieltage ---
    const spiele = spieleZusammenfuehren(
      parseSpielplanHtml(html, vereinsSuchtext),
      gruppenHtml ? parseSpielplanHtml(gruppenHtml, vereinsSuchtext) : [],
    )
    console.log(`  Spielplan: ${spiele.length} Begegnung(en).`)
    if (spiele.length === 0) debugSchreiben(html, `${mannschaft.name}-spielplan`)

    const geschrieben = []
    for (const spiel of spiele) {
      try {
        geschrieben.push(await spieltagSchreiben(db, team.id, spiel))
        bilanz.spieltage += 1
        console.log(
          `    ✓ ${spiel.datum} ${spiel.uhrzeit}${spiel.uhrzeitFehlt ? ' (Uhrzeit fehlte)' : ''} ` +
            `${spiel.heimAuswaerts} vs. ${spiel.gegner} (${spiel.status})`,
        )
      } catch (err) {
        console.error(`    ✗ ${spiel.datum}: ${err.message}`)
      }
    }

    // Verschobene Begegnungen hinterlassen sonst einen Eintrag am alten Datum.
    // Aufgeräumt wird nur, wenn der Abruf überhaupt Spiele geliefert hat, damit
    // eine vorübergehend nicht lesbare Seite keine Termine löscht. Von Hand
    // angelegte Spieltage bleiben unberührt.
    if (geschrieben.length > 0) {
      const veraltet = await veralteteSpieltageEntfernen(db, team.id, geschrieben)
      if (veraltet > 0) console.log(`    ${veraltet} veraltete(n) nuLiga-Eintrag entfernt.`)
    }

    // --- Meldeliste / Spieler ---
    const meldeliste = parseMeldeliste(html)
    console.log(`  Meldeliste: ${meldeliste.length} Spieler.`)
    if (meldeliste.length === 0) {
      debugSchreiben(html, `${mannschaft.name}-meldeliste`)
    } else {
      try {
        const ergebnis = await spielerSynchronisieren(
          db,
          team.id,
          meldeliste,
          spielerCache,
          spielerAnlegen,
        )
        bilanz.spielerNeu += ergebnis.angelegt
        bilanz.spielerAktualisiert += ergebnis.aktualisiert
        console.log(
          `    ${ergebnis.angelegt} neu angelegt, ${ergebnis.aktualisiert} aktualisiert.`,
        )
      } catch (err) {
        console.error(`    ✗ Spieler konnten nicht geschrieben werden: ${err.message}`)
      }
    }

    // --- Ligatabelle ---
    if (!tabelleUebernehmen || !gruppenHtml) continue
    try {
      const tabelle = parseTabelle(gruppenHtml)
      if (tabelle.length === 0) {
        console.warn('  Ligatabelle konnte nicht gelesen werden.')
        debugSchreiben(gruppenHtml, `${mannschaft.name}-tabelle`)
        continue
      }
      await setDoc(
        doc(db, 'teams', team.id),
        {
          tabelle,
          tabelleGruppe: gruppe.name,
          tabelleUrl: gruppe.url,
          tabelleStand: new Date().toISOString(),
        },
        { merge: true },
      )
      bilanz.tabellen += 1
      const eigene = tabelle.find((z) =>
        z.mannschaft.toLowerCase().includes(vereinsSuchtext.toLowerCase()),
      )
      console.log(
        `  Ligatabelle: ${tabelle.length} Mannschaften übernommen` +
          (eigene ? ` – aktueller Platz ${eigene.rang}.` : '.'),
      )
    } catch (err) {
      console.error(`  Ligatabelle konnte nicht geladen werden: ${err.message}`)
    }
  }

  console.log(
    `\nZusammenfassung: ${mannschaften.length} Mannschaft(en) verarbeitet, ` +
      `${bilanz.teamsNeu} Team(s) neu, ${bilanz.spieltage} Spieltag-Eintrag(e), ` +
      `${bilanz.spielerNeu} Spieler neu, ${bilanz.spielerAktualisiert} Spieler aktualisiert, ` +
      `${bilanz.tabellen} Ligatabelle(n).`,
  )
}

// Nur ausführen, wenn die Datei direkt gestartet wird.
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\nFertig.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Abbruch:', err)
      process.exit(1)
    })
}
