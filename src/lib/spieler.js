// Ein Spieler kann in mehreren Mannschaften gemeldet sein und hat dort
// unterschiedliche Meldelisten-Ränge. Die nuLiga-Synchronisation legt diese
// je Team unter `meldelisteRaenge` ab; manuell angelegte Spieler haben nur
// das einfache Feld `meldelisteRang`.
export function rangFuerTeam(spieler, teamId) {
  const proTeam = spieler?.meldelisteRaenge?.[teamId]
  if (typeof proTeam === 'number') return proTeam
  if (typeof spieler?.meldelisteRang === 'number') return spieler.meldelisteRang
  return Number.MAX_SAFE_INTEGER
}

export function nachRang(teamId) {
  return (a, b) => rangFuerTeam(a, teamId) - rangFuerTeam(b, teamId)
}
