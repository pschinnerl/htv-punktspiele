// Zeigt die aus nuLiga übernommene Ligatabelle eines Teams.
// Die Tabelle liegt als Feld `tabelle` am Team-Dokument – Firestore erlaubt
// laut den Regeln keine eigenen Sammlungen außerhalb der definierten Pfade.

function formatStand(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function Tabelle({ team, vereinsSuchtext = 'Helmstedter', kompakt = false }) {
  const zeilen = team?.tabelle
  if (!Array.isArray(zeilen) || zeilen.length === 0) return null

  const stand = formatStand(team.tabelleStand)
  const suche = vereinsSuchtext.toLowerCase()

  return (
    <section className="card">
      <h2>Tabelle{team.tabelleGruppe ? ` – ${team.tabelleGruppe}` : ''}</h2>

      <div className="tabelle-wrapper">
        <table className="liga-tabelle">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Mannschaft</th>
              <th scope="col" className="zahl">
                Sp.
              </th>
              <th scope="col" className="zahl">
                Punkte
              </th>
              {!kompakt && (
                <th scope="col" className="zahl">
                  Matchp.
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr
                key={`${z.rang}-${z.mannschaft}`}
                className={
                  z.mannschaft?.toLowerCase().includes(suche) ? 'liga-tabelle__eigene' : undefined
                }
              >
                <td>{z.rang}.</td>
                <td>{z.mannschaft}</td>
                <td className="zahl">{z.begegnungen ?? '–'}</td>
                <td className="zahl">{z.punkte ?? '–'}</td>
                {!kompakt && <td className="zahl">{z.matchpunkte ?? '–'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stand && <p className="hint">Stand: {stand} (aus nuLiga übernommen)</p>}
    </section>
  )
}

export default Tabelle
