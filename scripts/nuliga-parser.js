// Reine Parser-Funktionen für die öffentlichen nuLiga-Seiten.
// Bewusst ohne Netzwerk- oder Firestore-Zugriff, damit sie isoliert
// getestet werden können (siehe nuliga-sync.test.mjs).
//
// Hinweis zur Bauweise: Die nuLiga-Seiten haben keine dokumentierte
// HTML-Struktur und enthalten mehrere Tabellen (Rangtabelle, Spielplan,
// Meldeliste). Deshalb werden ALLE Tabellenzeilen der Seite durchsucht und
// anhand ihres Inhalts eingeordnet – nicht anhand von CSS-Klassen oder der
// Reihenfolge der Tabellen.

import * as cheerio from 'cheerio'

const DATUM_REGEX = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/
const ZEIT_REGEX = /^(\d{1,2}):(\d{2})$/
const PAAR_REGEX = /^\d{1,3}:\d{1,3}$/
const RANG_REGEX = /^(\d{1,2})\.?$/
const LK_REGEX = /^LK\s?\d{1,2}[,.]\d$/i
const WOCHENTAG_REGEX = /^(mo|di|mi|do|fr|sa|so)\.?$/i
const RAUSCHEN_REGEX =
  /^(anzeigen|spielbericht|bericht|ergebnis(se)?|details?|detail|vorschau|mehr|pdf|drucken|karte|anfahrt|tabelle|spielplan|offen|hin|rück|rueck|verlegt|abgesagt|kommentar|info|heimmannschaft|gastmannschaft|mannschaft|datum|matchpunkte|sätze|spiele|nation|gesamt|einzel|doppel|rang)$/i

export function normalisiere(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

function zellenTexte($, zeile) {
  return $(zeile)
    .find('td, th')
    .map((_, z) => normalisiere($(z).text()))
    .get()
}

export function parseDatumIso(text) {
  const m = text.match(DATUM_REGEX)
  if (!m) return null
  const [, tag, monat, jahrRoh] = m
  const jahr = jahrRoh.length === 2 ? `20${jahrRoh}` : jahrRoh
  return `${jahr.padStart(4, '0')}-${monat.padStart(2, '0')}-${tag.padStart(2, '0')}`
}

function istMannschaftsname(text) {
  const t = normalisiere(text)
  if (t.length < 3) return false
  if (!/\p{L}/u.test(t)) return false
  if (DATUM_REGEX.test(t)) return false
  if (ZEIT_REGEX.test(t)) return false
  if (LK_REGEX.test(t)) return false
  if (WOCHENTAG_REGEX.test(t)) return false
  if (RAUSCHEN_REGEX.test(t)) return false
  return true
}

// "Herren 40 (4er)" -> "Herren 40"
export function normalisiereTeamName(name) {
  return normalisiere(name)
    .replace(/\s*\(\s*\d+\s*er\s*\)\s*$/i, '')
    .trim()
}

// "Quoll, Malte (1981)"      -> "Malte Quoll"
// "Dr. Stanek, Emanuel (1975)" -> "Dr. Emanuel Stanek"
export function normalisiereSpielerName(roh) {
  const t = normalisiere(roh).replace(/\s*\(\s*\d{4}\s*\)\s*$/, '')
  const komma = t.indexOf(',')
  if (komma === -1) return t

  let nachname = t.slice(0, komma).trim()
  const vorname = t.slice(komma + 1).trim()
  if (!vorname) return nachname

  // Titel wandern mit nach vorne: "Dr. Stanek" + "Emanuel" -> "Dr. Emanuel Stanek"
  const titelTreffer = nachname.match(/^((?:Dr\.|Prof\.|Dipl\.[\wÄÖÜäöü.-]*)\s+)+/i)
  let titel = ''
  if (titelTreffer) {
    titel = `${titelTreffer[0].trim()} `
    nachname = nachname.slice(titelTreffer[0].length).trim()
  }
  return `${titel}${vorname} ${nachname}`.replace(/\s+/g, ' ').trim()
}

// Schlüssel für den Namensabgleich zwischen nuLiga und der App
// (Groß-/Kleinschreibung, Titel und Satzzeichen sollen keine Rolle spielen).
export function namensSchluessel(name) {
  return normalisiere(name)
    .toLowerCase()
    .replace(/\b(dr|prof|dipl)\.?\b/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

// ---------------------------------------------------------------------------
// Vereinsseite (clubTeams): alle Mannschaften des Vereins
// ---------------------------------------------------------------------------
export function parseVereinsseite(html, basisUrl) {
  const $ = cheerio.load(html)
  const gefunden = []
  const gesehen = new Set()

  $('a[href*="teamPortrait"]').each((_, link) => {
    const href = $(link).attr('href')
    if (!href) return

    let url
    try {
      url = new URL(href, basisUrl).toString()
    } catch {
      return
    }
    if (gesehen.has(url)) return

    const rohName = normalisiere($(link).text())
    if (!istMannschaftsname(rohName)) return

    let saison = ''
    try {
      saison = normalisiere(new URL(url).searchParams.get('championship') || '')
    } catch {
      saison = ''
    }

    const zellen = zellenTexte($, $(link).closest('tr'))
    const liga =
      zellen.find((z) => /liga|klasse|gruppe|\bGr\.?\s*\d/i.test(z) && z !== rohName) || ''

    gesehen.add(url)
    gefunden.push({
      nuligaName: rohName,
      name: normalisiereTeamName(rohName),
      liga,
      saison,
      url,
    })
  })

  return gefunden
}

// ---------------------------------------------------------------------------
// Mannschaftsseite (teamPortrait): Link zur Gruppen-/Ligaseite
// ---------------------------------------------------------------------------
export function parseGruppenLink(html, basisUrl) {
  const $ = cheerio.load(html)
  let treffer = null

  $('a[href*="groupPage"]').each((_, link) => {
    if (treffer) return
    const href = $(link).attr('href')
    if (!href) return
    try {
      treffer = {
        url: new URL(href, basisUrl).toString(),
        name: normalisiere($(link).text()),
      }
    } catch {
      treffer = null
    }
  })

  return treffer
}

// ---------------------------------------------------------------------------
// Spielplan (teamPortrait oder groupPage)
// ---------------------------------------------------------------------------
export function parseSpielplanHtml(html, vereinsSuchtext) {
  const $ = cheerio.load(html)
  const suche = vereinsSuchtext.toLowerCase()
  const spiele = []
  const gesehen = new Set()

  $('tr').each((_, zeile) => {
    const zellen = zellenTexte($, zeile)
    if (zellen.length < 3) return

    const datumIndex = zellen.findIndex((z) => DATUM_REGEX.test(z))
    if (datumIndex === -1) return
    const datumZelle = zellen[datumIndex]
    const datum = parseDatumIso(datumZelle)
    if (!datum) return

    // Uhrzeit steht in nuLiga meist mit im Datumsfeld ("03.05.2026 14:00"),
    // gelegentlich aber auch in einer eigenen Spalte.
    let uhrzeit = null
    const zeitImDatum = datumZelle.match(/(\d{1,2}:\d{2})/)
    if (zeitImDatum) {
      uhrzeit = zeitImDatum[1]
    } else {
      const zeitZelle = zellen.find((z, i) => i !== datumIndex && ZEIT_REGEX.test(z))
      if (zeitZelle) uhrzeit = zeitZelle
    }

    // Mannschaftsnamen werden aus dem Zellentext gelesen, NICHT aus den Links:
    // Auf der eigenen Mannschaftsseite ist die eigene Mannschaft nicht
    // verlinkt (man ist ja schon dort), verlinkt sind dort nur der Gegner und
    // der "anzeigen"-Spielbericht. Über die Links wäre die eigene Mannschaft
    // also unsichtbar und die Zeile würde übersprungen.
    const teamIndizes = []
    zellen.forEach((z, i) => {
      if (i !== datumIndex && istMannschaftsname(z)) teamIndizes.push(i)
    })

    const eigenPos = teamIndizes.findIndex((i) => zellen[i].toLowerCase().includes(suche))
    if (eigenPos === -1) return

    let heimAuswaerts
    let gegnerIndex
    if (eigenPos === 0) {
      if (teamIndizes.length < 2) return
      heimAuswaerts = 'heim'
      gegnerIndex = teamIndizes[1]
    } else {
      heimAuswaerts = 'auswaerts'
      gegnerIndex = teamIndizes[eigenPos - 1]
    }

    const gegner = zellen[gegnerIndex]
    if (!gegner || gegner.toLowerCase().includes(suche)) return

    // Das Ergebnis (Matchpunkte) steht rechts der beiden Mannschaftsspalten.
    // Die Suche startet bewusst erst dahinter, damit Datum, Uhrzeit oder eine
    // Spielnummer nicht versehentlich als Ergebnis gelesen werden.
    const abIndex = Math.max(teamIndizes[eigenPos], gegnerIndex)
    const ergebnis = zellen.slice(abIndex + 1).find((z) => PAAR_REGEX.test(z)) || null

    const schluessel = `${datum}|${gegner.toLowerCase()}`
    if (gesehen.has(schluessel)) return
    gesehen.add(schluessel)

    spiele.push({
      datum,
      uhrzeit: uhrzeit || '00:00',
      uhrzeitFehlt: !uhrzeit,
      heimAuswaerts,
      gegner,
      status: ergebnis ? 'gespielt' : 'geplant',
      ergebnisNuliga: ergebnis,
    })
  })

  return spiele.sort((a, b) => a.datum.localeCompare(b.datum))
}

// ---------------------------------------------------------------------------
// Meldeliste (teamPortrait): Spieler mit Rang und Leistungsklasse
// Spalten laut nuLiga: Rang | LK | ID-Nummer | Name, Vorname | Nation | ...
// ---------------------------------------------------------------------------
export function parseMeldeliste(html) {
  const $ = cheerio.load(html)
  const spieler = []
  const gesehen = new Set()

  $('tr').each((_, zeile) => {
    const zellen = zellenTexte($, zeile)
    if (zellen.length < 3) return

    const rangTreffer = zellen[0].match(RANG_REGEX)
    if (!rangTreffer) return

    const lkZelle = zellen.find((z) => LK_REGEX.test(z))
    // Namenszellen der Meldeliste haben das Format "Nachname, Vorname (Jahr)".
    // Das unterscheidet sie zuverlässig von Tabellen- und Spielplanzeilen,
    // in denen Mannschaftsnamen ohne Komma stehen.
    const nameZelle = zellen.find((z) => /^[^,]{2,},\s*\p{L}/u.test(z) && !DATUM_REGEX.test(z))
    if (!nameZelle) return
    if (!lkZelle && !/\(\s*\d{4}\s*\)/.test(nameZelle)) return

    const name = normalisiereSpielerName(nameZelle)
    if (!name) return

    const schluessel = namensSchluessel(name)
    if (!schluessel || gesehen.has(schluessel)) return
    gesehen.add(schluessel)

    spieler.push({
      meldelisteRang: Number(rangTreffer[1]),
      name,
      lk: lkZelle ? normalisiere(lkZelle).replace(/^LK\s*/i, 'LK ') : null,
    })
  })

  return spieler.sort((a, b) => a.meldelisteRang - b.meldelisteRang)
}

// ---------------------------------------------------------------------------
// Ligatabelle (groupPage)
// Spalten laut nuLiga: Rang | Mannschaft | Begegnungen | S | U | N |
//                      Tab.Punkte | Matchpunkte | Sätze | Spiele
// ---------------------------------------------------------------------------
export function parseTabelle(html) {
  const $ = cheerio.load(html)
  const zeilen = []
  const gesehen = new Set()

  $('tr').each((_, zeile) => {
    const zellen = zellenTexte($, zeile)
    if (zellen.length < 6) return

    // Die Rangspalte ist nicht immer die erste Zelle: nuLiga stellt der
    // Tabelle eine leere Zelle (Auf-/Absteiger-Markierung) voran.
    const rangIndex = zellen.findIndex((z) => RANG_REGEX.test(z))
    if (rangIndex === -1) return
    const rang = Number(zellen[rangIndex].match(RANG_REGEX)[1])

    // Tabellenzeilen enthalten mehrere "x:y"-Werte (Punkte, Sätze, Spiele) –
    // daran lassen sie sich von Meldelisten- und Spielplanzeilen unterscheiden.
    // Hier wird bewusst NICHT auf Uhrzeiten gefiltert: Werte wie "43:23"
    // sehen aus wie eine Uhrzeit, sind in der Tabelle aber Satzverhältnisse.
    // Zeilen mit Datum oder Leistungsklasse werden unten aussortiert.
    const paare = zellen.filter((z) => PAAR_REGEX.test(z))
    if (paare.length < 2) return
    if (zellen.some((z) => DATUM_REGEX.test(z))) return
    if (zellen.some((z) => LK_REGEX.test(z))) return

    const mannschaftIndex = zellen.findIndex(
      (z, i) => i > rangIndex && istMannschaftsname(z) && !PAAR_REGEX.test(z),
    )
    if (mannschaftIndex === -1) return
    const mannschaft = zellen[mannschaftIndex]

    // Zahlen zwischen Mannschaftsname und den Paaren: Begegnungen, S, U, N.
    // Ohne diese Spalten handelt es sich nicht um eine Tabellenzeile.
    const zahlen = zellen
      .slice(mannschaftIndex + 1)
      .filter((z) => /^\d{1,3}$/.test(z))
      .map(Number)
    if (zahlen.length < 2) return

    const schluessel = mannschaft.toLowerCase()
    if (gesehen.has(schluessel)) return
    gesehen.add(schluessel)

    zeilen.push({
      rang,
      mannschaft,
      begegnungen: zahlen[0] ?? null,
      siege: zahlen[1] ?? null,
      unentschieden: zahlen[2] ?? null,
      niederlagen: zahlen[3] ?? null,
      punkte: paare[0] ?? null,
      matchpunkte: paare[1] ?? null,
      saetze: paare[2] ?? null,
      spiele: paare[3] ?? null,
    })
  })

  return zeilen.sort((a, b) => a.rang - b.rang)
}
