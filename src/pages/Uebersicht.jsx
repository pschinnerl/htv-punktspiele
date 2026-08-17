import { Link } from 'react-router-dom'
import { useTeamAuswahl } from '../context/TeamContext'
import { useSpieltage } from '../hooks/useSpieltage'
import { useSpieler } from '../hooks/useSpieler'
import { formatDatum, heuteIso } from '../lib/datum'

function Uebersicht() {
  const { team, teamId, teams, teamsLaden } = useTeamAuswahl()
  const { spieltage } = useSpieltage(teamId)
  const { spieler } = useSpieler(teamId)

  const heute = heuteIso()
  const kommende = spieltage.filter(
    (s) => (s.datum || '') >= heute && s.status !== 'ausgefallen',
  )
  const naechster = kommende[0]

  if (!teamsLaden && teams.length === 0) {
    return (
      <div className="page">
        <h1>Willkommen</h1>
        <p>
          Es ist noch keine Mannschaft angelegt. Lege unter{' '}
          <Link to="/teams">Teams</Link> die erste Mannschaft an – oder lass sie durch die
          nächtliche nuLiga-Synchronisation automatisch anlegen.
        </p>
        <p className="hint">
          Wie alles zusammenspielt, steht in der <Link to="/hilfe">Hilfe</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Übersicht{team ? ` – ${team.name}` : ''}</h1>
      {team && (
        <p className="hint">{[team.liga, team.saison].filter(Boolean).join(' · ')}</p>
      )}

      <section className="card">
        <h2>Nächster Spieltag</h2>
        {!naechster && <p className="hint">Kein kommender Spieltag geplant.</p>}
        {naechster && (
          <>
            <p className="uebersicht__gross">
              {formatDatum(naechster.datum)} · {naechster.uhrzeit} Uhr
            </p>
            <p className="hint">
              {naechster.heimAuswaerts === 'heim' ? 'Heim' : 'Auswärts'} gegen{' '}
              {naechster.gegner}
              {naechster.treffpunkt ? ` · Treffpunkt: ${naechster.treffpunkt}` : ''}
            </p>
            <Link className="btn btn--primary btn--klein" to="/spieltage">
              Verfügbarkeit &amp; Aufstellung öffnen
            </Link>
          </>
        )}
      </section>

      <section className="card">
        <h2>Auf einen Blick</h2>
        <ul className="kennzahlen">
          <li>
            <strong>{spieler.length}</strong>
            <span className="hint">Spieler gemeldet</span>
          </li>
          <li>
            <strong>{kommende.length}</strong>
            <span className="hint">Spieltage offen</span>
          </li>
          <li>
            <strong>{spieltage.length - kommende.length}</strong>
            <span className="hint">Spieltage vorbei</span>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default Uebersicht
