// Erzeugt eine ICS-Kalenderdatei (RFC 5545) für Spieltage – komplett im
// Browser, ohne Server. Die Zeiten werden als "floating time" (ohne Zeitzone)
// geschrieben; Kalender-Apps zeigen sie dann in der lokalen Zeit an, was für
// Punktspiele in Deutschland genau richtig ist.

const SPIELDAUER_STUNDEN = 4

function icsEscape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// "2026-05-17", "14:00" -> "20260517T140000"
function icsZeit(datum, uhrzeit) {
  const d = datum.replace(/-/g, '')
  const u = (uhrzeit || '09:00').replace(':', '') + '00'
  return `${d}T${u}`
}

// Endzeit: Startzeit + Spieldauer (inkl. Datumswechsel bei späten Spielen).
function icsEnde(datum, uhrzeit) {
  const [jahr, monat, tag] = datum.split('-').map(Number)
  const [stunde, minute] = (uhrzeit || '09:00').split(':').map(Number)
  const ende = new Date(jahr, monat - 1, tag, stunde + SPIELDAUER_STUNDEN, minute)
  const mm = String(ende.getMonth() + 1).padStart(2, '0')
  const dd = String(ende.getDate()).padStart(2, '0')
  const hh = String(ende.getHours()).padStart(2, '0')
  const mi = String(ende.getMinutes()).padStart(2, '0')
  return `${ende.getFullYear()}${mm}${dd}T${hh}${mi}00`
}

export function erzeugeIcs(spieltage, teamNamen = {}) {
  const zeilen = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HTV Helmstedt//Punktspiele//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const s of spieltage) {
    if (!s.datum) continue
    const teamName = teamNamen[s.teamId]
    const heim = s.heimAuswaerts === 'heim'
    const titel =
      `Punktspiel${teamName ? ` ${teamName}` : ''}: ` +
      `${heim ? 'Heim' : 'Auswärts'} gegen ${s.gegner || '?'}`

    const beschreibung = []
    if (s.treffpunkt) beschreibung.push(`Treffpunkt: ${s.treffpunkt}`)
    if (s.antwortFrist) beschreibung.push(`Rückmeldung bis: ${s.antwortFrist}`)

    zeilen.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@htv-punktspiele`,
      `DTSTAMP:${icsZeit(s.datum, s.uhrzeit)}`,
      `DTSTART:${icsZeit(s.datum, s.uhrzeit)}`,
      `DTEND:${icsEnde(s.datum, s.uhrzeit)}`,
      `SUMMARY:${icsEscape(titel)}`,
    )
    if (s.adresse) zeilen.push(`LOCATION:${icsEscape(s.adresse)}`)
    if (beschreibung.length > 0) {
      zeilen.push(`DESCRIPTION:${icsEscape(beschreibung.join('\n'))}`)
    }
    zeilen.push('END:VEVENT')
  }

  zeilen.push('END:VCALENDAR')
  return zeilen.join('\r\n') + '\r\n'
}

// Startet den Download der ICS-Datei im Browser. Auf dem Smartphone bietet
// das Betriebssystem danach direkt "Zum Kalender hinzufügen" an.
export function ladeIcsHerunter(spieltage, teamNamen, dateiname = 'htv-punktspiele.ics') {
  const inhalt = erzeugeIcs(spieltage, teamNamen)
  const blob = new Blob([inhalt], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = dateiname
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
