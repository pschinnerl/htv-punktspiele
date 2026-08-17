// Plausibilitätsprüfung der Aufstellung nach den üblichen Regeln der
// Wettspielordnung (Aufstellung in Meldelisten-Reihenfolge). Die Prüfung
// blockiert nichts – sie liefert nur Warnhinweise für den Mannschaftsführer,
// denn es gibt legitime Ausnahmen (z.B. aktualisierte LK-Reihenfolge).
import { rangFuerTeam } from './spieler'

export function aufstellungsWarnungen({ zeilen, spieler, teamId, verfuegbarkeit }) {
  const warnungen = []
  if (!Array.isArray(zeilen) || zeilen.length === 0) return warnungen

  const spielerById = new Map(spieler.map((s) => [s.id, s]))
  const name = (id) => spielerById.get(id)?.name || 'Unbekannt'
  const rang = (id) => rangFuerTeam(spielerById.get(id), teamId)

  // Nur Zeilen mit mindestens einem Spieler betrachten, in Zeilen-Reihenfolge.
  const belegte = zeilen
    .map((z) => ({
      label: z.label?.trim() || 'Position',
      ids: [z.spieler1, z.spieler2].filter(Boolean),
    }))
    .filter((z) => z.ids.length > 0)

  const einzel = belegte.filter((z) => z.ids.length === 1)
  const doppel = belegte.filter((z) => z.ids.length === 2)

  // 1. Mehrfach aufgestellte Spieler – getrennt nach Einzel und Doppel geprüft,
  // denn derselbe Spieler darf natürlich Einzel UND Doppel spielen.
  for (const gruppe of [einzel, doppel]) {
    const gesehen = new Map()
    for (const zeile of gruppe) {
      for (const id of zeile.ids) {
        if (gesehen.has(id)) {
          warnungen.push(
            `${name(id)} ist mehrfach aufgestellt (${gesehen.get(id)} und ${zeile.label}).`,
          )
        } else {
          gesehen.set(id, zeile.label)
        }
      }
    }
  }

  // 2. Spieler ohne Zusage
  if (verfuegbarkeit) {
    const alleIds = new Set(belegte.flatMap((z) => z.ids))
    for (const id of alleIds) {
      if (verfuegbarkeit[id]?.status !== 'zugesagt') {
        const status = verfuegbarkeit[id]?.status === 'abgesagt' ? 'hat abgesagt' : 'hat noch nicht zugesagt'
        warnungen.push(`${name(id)} ist aufgestellt, ${status}.`)
      }
    }
  }

  // 3. Einzel: Meldelisten-Reihenfolge (Zeilen mit genau einem Spieler)
  for (let i = 1; i < einzel.length; i++) {
    const vorher = einzel[i - 1]
    const jetzt = einzel[i]
    if (rang(jetzt.ids[0]) < rang(vorher.ids[0])) {
      warnungen.push(
        `Reihenfolge Einzel: ${name(jetzt.ids[0])} (Rang ${rang(jetzt.ids[0])}, ${jetzt.label}) ` +
          `müsste vor ${name(vorher.ids[0])} (Rang ${rang(vorher.ids[0])}, ${vorher.label}) stehen.`,
      )
    }
  }

  // 4. Doppel: Reihenfolge nach Rangsumme (Zeilen mit zwei Spielern)
  const summe = (z) => rang(z.ids[0]) + rang(z.ids[1])
  for (let i = 1; i < doppel.length; i++) {
    if (summe(doppel[i]) < summe(doppel[i - 1])) {
      warnungen.push(
        `Reihenfolge Doppel: ${doppel[i].label} (Rangsumme ${summe(doppel[i])}) ` +
          `müsste vor ${doppel[i - 1].label} (Rangsumme ${summe(doppel[i - 1])}) stehen.`,
      )
    }
  }

  return warnungen
}
