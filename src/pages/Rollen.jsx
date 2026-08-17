import { useState } from 'react'
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useTeamAuswahl } from '../context/TeamContext'
import { useRollen } from '../hooks/useRollen'

const leer = { uid: '', email: '', rolle: 'mannschaftsfuehrer', teamIds: [] }

function RollenForm({ initial, teams, onSpeichern, onAbbrechen, speichernText }) {
  const [werte, setWerte] = useState(initial || leer)
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState(null)
  const bearbeitung = !!initial

  function teamUmschalten(id) {
    setWerte((w) => ({
      ...w,
      teamIds: w.teamIds.includes(id)
        ? w.teamIds.filter((t) => t !== id)
        : [...w.teamIds, id],
    }))
  }

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    const uid = werte.uid.trim()
    if (!uid) {
      setFehler('Bitte die Benutzerkennung (UID) aus der Firebase Console eintragen.')
      return
    }
    setSpeichern(true)
    try {
      await onSpeichern({
        uid,
        email: werte.email.trim(),
        rolle: werte.rolle,
        // Der Vorstand sieht ohnehin alle Mannschaften – dort ist die Liste egal.
        teamIds: werte.rolle === 'vorstand' ? [] : werte.teamIds,
      })
      if (!bearbeitung) setWerte(leer)
    } catch (err) {
      console.error('Zugang konnte nicht gespeichert werden:', err)
      setFehler(
        'Der Zugang konnte nicht gespeichert werden. Bitte prüfen, ob die aktualisierten ' +
          'Firestore-Regeln veröffentlicht sind.',
      )
    } finally {
      setSpeichern(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={absenden}>
      <label className="field">
        <span>Benutzerkennung (UID)</span>
        <input
          required
          value={werte.uid}
          disabled={bearbeitung}
          onChange={(e) => setWerte((w) => ({ ...w, uid: e.target.value }))}
          placeholder="aus Firebase Console → Authentication"
        />
      </label>
      <label className="field">
        <span>E-Mail (nur zur Anzeige)</span>
        <input
          type="email"
          value={werte.email}
          onChange={(e) => setWerte((w) => ({ ...w, email: e.target.value }))}
          placeholder="name@example.de"
        />
      </label>
      <label className="field">
        <span>Rolle</span>
        <select
          value={werte.rolle}
          onChange={(e) => setWerte((w) => ({ ...w, rolle: e.target.value }))}
        >
          <option value="mannschaftsfuehrer">Mannschaftsführer</option>
          <option value="vorstand">Vorstand (darf alles)</option>
        </select>
      </label>

      {werte.rolle === 'mannschaftsfuehrer' && (
        <fieldset className="rollen-teams">
          <legend>Betreute Mannschaften</legend>
          {teams.length === 0 && <span className="hint">Noch keine Teams angelegt.</span>}
          {teams.map((t) => (
            <label key={t.id} className="rollen-teams__eintrag">
              <input
                type="checkbox"
                checked={werte.teamIds.includes(t.id)}
                onChange={() => teamUmschalten(t.id)}
              />
              {t.name}
            </label>
          ))}
        </fieldset>
      )}

      {fehler && <p className="form-error">{fehler}</p>}
      <div className="inline-form__actions">
        <button type="submit" className="btn btn--primary" disabled={speichern}>
          {speichern ? 'Speichern …' : speichernText || 'Zugang anlegen'}
        </button>
        {onAbbrechen && (
          <button type="button" className="btn btn--secondary" onClick={onAbbrechen}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}

function Rollen() {
  const { user, istVorstand } = useAuth()
  const { teams } = useTeamAuswahl()
  const { rollen, loading, fehler } = useRollen()
  const [bearbeiteId, setBearbeiteId] = useState(null)
  const [aktionsFehler, setAktionsFehler] = useState(null)

  async function speichern({ uid, email, rolle, teamIds }) {
    const daten = { rolle, teamIds }
    if (email) daten.email = email
    await setDoc(doc(db, 'rollen', uid), daten)
    setBearbeiteId(null)
  }

  async function loeschen(eintrag) {
    setAktionsFehler(null)
    if (eintrag.id === user.uid) {
      setAktionsFehler('Der eigene Zugang kann nicht gelöscht werden.')
      return
    }
    if (
      !window.confirm(
        `Zugang für ${eintrag.email || eintrag.id} wirklich entfernen? ` +
          'Die Person kann sich danach zwar noch anmelden, sieht aber keine Daten mehr.',
      )
    ) {
      return
    }
    try {
      await deleteDoc(doc(db, 'rollen', eintrag.id))
    } catch (err) {
      console.error('Zugang konnte nicht entfernt werden:', err)
      setAktionsFehler('Der Zugang konnte nicht entfernt werden.')
    }
  }

  const teamNamen = (ids) =>
    (ids || [])
      .map((id) => teams.find((t) => t.id === id)?.name || '– gelöschtes Team –')
      .join(', ')

  // Zusätzlich zur ausgeblendeten Menüzeile: direkter Aufruf der Adresse
  // bringt Mannschaftsführern nichts. Verbindlich sind ohnehin die Regeln.
  if (!istVorstand) {
    return (
      <div className="page">
        <h1>Zugänge</h1>
        <p>Diesen Bereich darf nur der Vorstand öffnen.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Zugänge</h1>
      <p className="hint">
        Hier wird festgelegt, wer die Verwaltung sehen darf und welche Mannschaften ein
        Mannschaftsführer betreut. Das <strong>Benutzerkonto selbst</strong> (E-Mail und
        Passwort) wird weiterhin in der Firebase Console unter „Authentication“ angelegt –
        dort steht auch die Benutzerkennung (UID), die unten eingetragen wird.
      </p>

      <section className="card">
        <h2>Neuer Zugang</h2>
        <RollenForm teams={teams} onSpeichern={speichern} />
      </section>

      <section className="card">
        <h2>Vorhandene Zugänge</h2>
        {loading && <p className="hint">Lade …</p>}
        {fehler && <p className="form-error">{fehler}</p>}
        {aktionsFehler && <p className="form-error">{aktionsFehler}</p>}
        {!loading && !fehler && rollen.length === 0 && (
          <p className="hint">Noch keine Zugänge hinterlegt.</p>
        )}

        <ul className="spieler-list">
          {rollen.map((r) =>
            bearbeiteId === r.id ? (
              <li key={r.id} className="spieler-list__item spieler-list__item--bearbeiten">
                <RollenForm
                  initial={{
                    uid: r.id,
                    email: r.email || '',
                    rolle: r.rolle || 'mannschaftsfuehrer',
                    teamIds: r.teamIds || [],
                  }}
                  teams={teams}
                  speichernText="Speichern"
                  onSpeichern={speichern}
                  onAbbrechen={() => setBearbeiteId(null)}
                />
              </li>
            ) : (
              <li key={r.id} className="spieler-list__item">
                <div className="zugang-info">
                  <strong>{r.email || r.id}</strong>
                  <span className="hint">
                    {r.rolle === 'vorstand'
                      ? 'Vorstand – sieht alle Mannschaften'
                      : `Mannschaftsführer: ${teamNamen(r.teamIds) || 'keine Mannschaft zugeordnet'}`}
                    {r.id === user.uid ? ' · das bist du' : ''}
                  </span>
                </div>
                <div className="spieler-list__actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => setBearbeiteId(r.id)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => loeschen(r)}
                  >
                    Entfernen
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}

export default Rollen
