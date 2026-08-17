import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useSpieltage } from '../../hooks/useSpieltage'
import { formatDatum, formatDatumKurz } from '../../lib/datum'
import SpieltagForm from './SpieltagForm'
import SpieltagDetails from './SpieltagDetails'

const STATUS_LABEL = {
  geplant: 'Geplant',
  gespielt: 'Gespielt',
  ausgefallen: 'Ausgefallen',
}

function Spieltage({ teamId, teamName }) {
  const { spieltage, loading, fehler } = useSpieltage(teamId)
  const [bearbeiteId, setBearbeiteId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [aktionsFehler, setAktionsFehler] = useState(null)

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
    setAktionsFehler(null)
    try {
      await updateDoc(doc(db, 'spieltage', id), { status })
    } catch (err) {
      console.error('Status konnte nicht geändert werden:', err)
      setAktionsFehler('Der Status konnte nicht geändert werden. Bitte erneut versuchen.')
    }
  }

  async function loeschen(id) {
    setAktionsFehler(null)
    if (!window.confirm('Diesen Spieltag wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'spieltage', id))
    } catch (err) {
      console.error('Spieltag konnte nicht gelöscht werden:', err)
      setAktionsFehler('Der Spieltag konnte nicht gelöscht werden. Bitte erneut versuchen.')
    }
  }

  return (
    <section className="card">
      <h2>Spieltage{teamName ? ` – ${teamName}` : ''}</h2>

      <SpieltagForm onSpeichern={anlegen} />

      {loading && <p className="hint">Lade …</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      {aktionsFehler && <p className="form-error">{aktionsFehler}</p>}
      {!loading && !fehler && spieltage.length === 0 && (
        <p className="hint">Noch keine Spieltage angelegt.</p>
      )}

      <ul className="spieltag-list">
        {spieltage.map((s) => {
          const ergebnis = s.ergebnis || s.ergebnisNuliga
          return bearbeiteId === s.id ? (
            <li key={s.id} className="spieltag-list__item spieltag-list__item--bearbeiten">
              <SpieltagForm
                initial={{
                  datum: s.datum,
                  uhrzeit: s.uhrzeit,
                  heimAuswaerts: s.heimAuswaerts,
                  gegner: s.gegner,
                  antwortFrist: s.antwortFrist || '',
                  treffpunkt: s.treffpunkt || '',
                  adresse: s.adresse || '',
                  ergebnis: s.ergebnis || '',
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
                    {ergebnis ? ` · ${ergebnis}` : ''}
                  </strong>
                  <span className="hint">
                    {s.heimAuswaerts === 'heim' ? 'Heim' : 'Auswärts'} gegen {s.gegner}
                  </span>
                  {(s.antwortFrist || s.treffpunkt) && (
                    <span className="hint">
                      {[
                        s.antwortFrist ? `Rückmeldung bis ${formatDatumKurz(s.antwortFrist)}` : null,
                        s.treffpunkt ? `Treffpunkt: ${s.treffpunkt}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
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
          )
        })}
      </ul>
    </section>
  )
}

export default Spieltage
