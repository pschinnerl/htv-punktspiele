import { Link, useParams } from 'react-router-dom'
import { useSpielerSession } from '../hooks/useSpielerSession'
import { useSpieltageFuerTeams } from '../hooks/useSpieltageFuerTeams'
import { useTeamDokumente } from '../hooks/useTeamDokumente'
import SpieltagKarte from '../features/spieler-ansicht/SpieltagKarte'
import Tabelle from '../features/tabelle/Tabelle'
import { ladeIcsHerunter } from '../lib/ics'
import { heuteIso } from '../lib/datum'

function Spieler() {
  const { token } = useParams()
  const { ladt, fehler, spielerId, teamIds } = useSpielerSession(token)
  const { spieltage, loading, fehler: spieltageFehler } = useSpieltageFuerTeams(teamIds)
  const { teams } = useTeamDokumente(teamIds)

  if (ladt) {
    return (
      <div className="page page--spieler">
        <p className="hint">Lade …</p>
      </div>
    )
  }

  if (fehler) {
    return (
      <div className="page page--spieler">
        <h1>Nicht gefunden</h1>
        <p>{fehler}</p>
      </div>
    )
  }

  const heute = heuteIso()
  const kommende = spieltage.filter((s) => (s.datum || '') >= heute)
  // Vergangene Spieltage: neueste zuerst, standardmäßig eingeklappt.
  const vergangene = spieltage.filter((s) => (s.datum || '') < heute).reverse()

  const teamNamen = Object.fromEntries(teams.map((t) => [t.id, t.name]))

  function kalenderExport() {
    ladeIcsHerunter(
      kommende.filter((s) => s.status !== 'ausgefallen'),
      teamNamen,
    )
  }

  return (
    <div className="page page--spieler">
      <h1>Meine Spieltage</h1>

      {loading && <p className="hint">Lade Spieltage …</p>}
      {spieltageFehler && <p className="form-error">{spieltageFehler}</p>}
      {!loading && !spieltageFehler && kommende.length === 0 && (
        <p className="hint">Aktuell sind keine Spieltage geplant.</p>
      )}

      {kommende.length > 0 && (
        <button type="button" className="btn btn--secondary btn--klein" onClick={kalenderExport}>
          📅 Spieltage in meinen Kalender übernehmen
        </button>
      )}

      <div className="spieltag-karten">
        {kommende.map((s) => (
          <SpieltagKarte key={s.id} spieltag={s} token={token} spielerId={spielerId} />
        ))}
      </div>

      {vergangene.length > 0 && (
        <details className="vergangene-spieltage">
          <summary>Vergangene Spieltage ({vergangene.length})</summary>
          <div className="spieltag-karten">
            {vergangene.map((s) => (
              <SpieltagKarte key={s.id} spieltag={s} token={token} spielerId={spielerId} vergangen />
            ))}
          </div>
        </details>
      )}

      {teams.map((team) => (
        <Tabelle key={team.id} team={team} kompakt />
      ))}

      <details className="hilfe-abschnitt">
        <summary>Hilfe – wie funktioniert das hier?</summary>
        <div className="hilfe-abschnitt__inhalt">
          <p>
            <strong>Zu- und absagen:</strong> Für jeden Spieltag auf „✓ Zusagen“ oder
            „✕ Absagen“ tippen. Noch unsicher? Dann „? Weiß noch nicht“ – der
            Mannschaftsführer sieht deine Antwort sofort. Du kannst sie jederzeit ändern.
          </p>
          <p>
            <strong>Kommentar:</strong> Ins Feld darunter passt eine kurze Anmerkung, etwa
            „komme erst 14:30“ oder „nur Doppel“. Sie ist nur für den Mannschaftsführer
            sichtbar.
          </p>
          <p>
            <strong>Aufstellung:</strong> Sobald der Mannschaftsführer die Aufstellung
            bestätigt hat, steht unten auf der Karte, für welche Position du eingeteilt bist.
          </p>
          <p>
            <strong>Kalender:</strong> Der Knopf „📅 Spieltage in meinen Kalender übernehmen“
            trägt alle kommenden Termine in den Kalender deines Handys ein – dann erinnert
            dich dein Handy von selbst.
          </p>
          <p>
            <strong>Als App speichern:</strong> Im Browser-Menü „Zum Home-Bildschirm
            hinzufügen“ wählen. Danach öffnest du diese Seite mit einem Tipp, ohne den Link
            wiederzufinden.
          </p>
          <p>
            <strong>Dein Link ist persönlich.</strong> Bitte nicht weitergeben – wer ihn hat,
            kann in deinem Namen zu- und absagen. Verloren? Der Mannschaftsführer schickt ihn
            dir erneut.
          </p>
          <p className="hint">
            Wie mit deinen Daten umgegangen wird, steht im{' '}
            <Link to="/datenschutz">Datenschutzhinweis</Link>.
          </p>
        </div>
      </details>
    </div>
  )
}

export default Spieler
