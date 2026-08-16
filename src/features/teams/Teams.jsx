import { useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useTeams } from '../../hooks/useTeams'

const leer = { name: '', liga: '', saison: '' }

function TeamForm({ initial, onSpeichern, onAbbrechen, speichernText = 'Team anlegen' }) {
  const [werte, setWerte] = useState(initial || leer)
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState(null)

  function setFeld(feld, wert) {
    setWerte((w) => ({ ...w, [feld]: wert }))
  }

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichern(true)
    try {
      await onSpeichern({
        name: werte.name.trim(),
        liga: werte.liga.trim(),
        saison: werte.saison.trim(),
      })
      if (!initial) setWerte(leer)
    } catch (err) {
      console.error('Team konnte nicht gespeichert werden:', err)
      setFehler('Team konnte nicht gespeichert werden.')
    } finally {
      setSpeichern(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={absenden}>
      <label className="field">
        <span>Name</span>
        <input
          required
          value={werte.name}
          onChange={(e) => setFeld('name', e.target.value)}
          placeholder="z.B. Herren 40"
        />
      </label>
      <label className="field">
        <span>Liga</span>
        <input
          value={werte.liga}
          onChange={(e) => setFeld('liga', e.target.value)}
          placeholder="z.B. Bezirksliga"
        />
      </label>
      <label className="field">
        <span>Saison</span>
        <input
          value={werte.saison}
          onChange={(e) => setFeld('saison', e.target.value)}
          placeholder="z.B. Sommer 2026"
        />
      </label>
      {fehler && <p className="form-error">{fehler}</p>}
      <div className="inline-form__actions">
        <button type="submit" className="btn btn--primary" disabled={speichern}>
          {speichern ? 'Speichern …' : speichernText}
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

function Teams({ ausgewaehltesTeam, onAuswaehlen }) {
  const { istVorstand } = useAuth()
  const { teams, loading } = useTeams()
  const [bearbeiteId, setBearbeiteId] = useState(null)
  const [fehler, setFehler] = useState(null)

  async function anlegen(werte) {
    await addDoc(collection(db, 'teams'), werte)
  }

  async function speichernBearbeitung(id, werte) {
    await updateDoc(doc(db, 'teams', id), werte)
    setBearbeiteId(null)
  }

  // Ein Team wird nur gelöscht, wenn keine Spieler und keine Spieltage mehr
  // daran hängen. Firestore löscht abhängige Dokumente nicht automatisch mit –
  // ohne diese Prüfung entstünden unsichtbare Datenreste.
  async function loeschen(team) {
    setFehler(null)
    try {
      const [spielerSnap, spieltageSnap] = await Promise.all([
        getDocs(
          query(collection(db, 'spieler'), where('teamIds', 'array-contains', team.id)),
        ),
        getDocs(query(collection(db, 'spieltage'), where('teamId', '==', team.id))),
      ])

      if (!spielerSnap.empty || !spieltageSnap.empty) {
        const teile = []
        if (!spielerSnap.empty) teile.push(`${spielerSnap.size} Spieler`)
        if (!spieltageSnap.empty) teile.push(`${spieltageSnap.size} Spieltag(e)`)
        setFehler(
          `„${team.name}“ kann nicht gelöscht werden: Es hängen noch ${teile.join(' und ')} daran. ` +
            'Bitte diese zuerst entfernen.',
        )
        return
      }

      if (!window.confirm(`Team „${team.name}“ wirklich löschen?`)) return

      await deleteDoc(doc(db, 'teams', team.id))
      if (ausgewaehltesTeam === team.id) onAuswaehlen(null)
    } catch (err) {
      console.error('Team konnte nicht gelöscht werden:', err)
      setFehler('Team konnte nicht gelöscht werden.')
    }
  }

  return (
    <div>
      {istVorstand && (
        <section className="card">
          <h2>Neues Team</h2>
          <TeamForm onSpeichern={anlegen} />
        </section>
      )}

      <section className="card">
        <h2>Teams</h2>
        {loading && <p className="hint">Lade …</p>}
        {!loading && teams.length === 0 && (
          <p className="hint">Noch keine Teams angelegt.</p>
        )}
        {fehler && <p className="form-error">{fehler}</p>}

        <ul className="team-list">
          {teams.map((team) =>
            bearbeiteId === team.id ? (
              <li key={team.id} className="team-list__eintrag team-list__eintrag--bearbeiten">
                <TeamForm
                  initial={{
                    name: team.name || '',
                    liga: team.liga || '',
                    saison: team.saison || '',
                  }}
                  speichernText="Speichern"
                  onSpeichern={(werte) => speichernBearbeitung(team.id, werte)}
                  onAbbrechen={() => setBearbeiteId(null)}
                />
              </li>
            ) : (
              <li key={team.id} className="team-list__eintrag">
                <button
                  type="button"
                  className={
                    'team-list__item' +
                    (ausgewaehltesTeam === team.id ? ' team-list__item--aktiv' : '')
                  }
                  onClick={() => onAuswaehlen(team.id)}
                >
                  <strong>{team.name}</strong>
                  <span className="hint">
                    {[team.liga, team.saison].filter(Boolean).join(' · ')}
                  </span>
                </button>
                <div className="team-list__actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => setBearbeiteId(team.id)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => loeschen(team)}
                  >
                    Löschen
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

export default Teams
