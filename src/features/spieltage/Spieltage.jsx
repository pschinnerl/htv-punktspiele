import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useSpieltage } from '../../hooks/useSpieltage'
import SpieltagForm from './SpieltagForm'
import SpieltagDetails from './SpieltagDetails'

const STATUS_LABEL = {
  geplant: 'Geplant',
  gespielt: 'Gespielt',
  ausgefallen: 'Ausgefallen',
}

function formatDatum(datum) {
  if (!datum) return ''
  const [jahr, monat, tag] = datum.split('-')
  return `${tag}.${monat}.${jahr}`
}

function Spieltage({ teamId, teamName }) {
  const { spieltage, loading, fehler } = useSpieltage(teamId)
  const [bearbeiteId, setBearbeiteId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)

  async function anlegen(werte) {
    await addDoc(collection(db, 'spieltage'), {
      ...werte,
      teamId,
      status: 'geplant',
    })
  }

  async function speichernBearbeitung(id, werte) {
    await updateDoc(doc(db, 'spieltage', id), werte)
    setBearbeiteId(null)
  }

  async function statusAendern(id, status) {
    try {
      await updateDoc(doc(db, 'spieltage', id), { status })
    } catch (err) {
      console.error('Status konnte nicht geändert werden:', err)
    }
  }

  async function loeschen(id) {
    if (!window.confirm('Diesen Spieltag wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'spieltage', id))
    } catch (err) {
      console.error('Spieltag konnte nicht gelöscht werden:', err)
    }
  }

  return (
    <section className="card">
      <h2>Spieltage{teamName ? ` – ${teamName}` : ''}</h2>

      <SpieltagForm onSpeichern={anlegen} />

      {loading && <p className="hint">Lade …</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      {!loading && !fehler && spieltage.length === 0 && (
        <p className="hint">Noch keine Spieltage angelegt.</p>
      )}

      <ul className="spieltag-list">
        {spieltage.map((s) =>
          bearbeiteId === s.id ? (
            <li key={s.id} className="spieltag-list__item spieltag-list__item--bearbeiten">
              <SpieltagForm
                initial={{
                  datum: s.datum,
                  uhrzeit: s.uhrzeit,
                  heimAuswaerts: s.heimAuswaerts,
                  gegner: s.gegner,
                }}
                speichernText="Speichern"
                onSpeichern={(werte) => speichernBearbeitung(s.id, werte)}
                onAbbrechen={() => setBearbeiteId(null)}
              />
            </li>
          ) : (
            <li key={s.id} className="spieltag-list__item spieltag-list__item--block">
              <div className="spieltag-list__zeile">
                <div className="spieltag-list__info">
                  <strong>
                    {formatDatum(s.datum)} · {s.uhrzeit} Uhr
                  </strong>
                  <span className="hint">
                    {s.heimAuswaerts === 'heim' ? 'Heim' : 'Auswärts'} gegen {s.gegner}
                  </span>
                </div>
                <div className="spieltag-list__actions">
                  <select
                    value={s.status}
                    onChange={(e) => statusAendern(s.id, e.target.value)}
                    aria-label="Status"
                  >
                    {Object.entries(STATUS_LABEL).map(([wert, label]) => (
                      <option key={wert} value={wert}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => setDetailsId(detailsId === s.id ? null : s.id)}
                  >
                    {detailsId === s.id ? 'Details schließen' : 'Verfügbarkeit/Aufstellung'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => setBearbeiteId(s.id)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--klein"
                    onClick={() => loeschen(s.id)}
                  >
                    Löschen
                  </button>
                </div>
              </div>

              {detailsId === s.id && <SpieltagDetails spieltag={s} teamId={teamId} />}
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

export default Spieltage
