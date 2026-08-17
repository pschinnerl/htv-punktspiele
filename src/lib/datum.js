// Gemeinsame Datums-Hilfen für Verwaltung und Spieler-Ansicht.

// Heutiges Datum als ISO-String (YYYY-MM-DD) in lokaler Zeit.
export function heuteIso() {
  const jetzt = new Date()
  const monat = String(jetzt.getMonth() + 1).padStart(2, '0')
  const tag = String(jetzt.getDate()).padStart(2, '0')
  return `${jetzt.getFullYear()}-${monat}-${tag}`
}

// "2026-05-17" -> "17.05.2026"
export function formatDatum(datum) {
  if (!datum) return ''
  const [jahr, monat, tag] = datum.split('-')
  return `${tag}.${monat}.${jahr}`
}

// "2026-05-17" -> "17.05." (für kurze Hinweise wie die Antwortfrist)
export function formatDatumKurz(datum) {
  if (!datum) return ''
  const [, monat, tag] = datum.split('-')
  return `${tag}.${monat}.`
}
