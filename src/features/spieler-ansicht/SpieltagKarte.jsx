import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { formatDatum, formatDatumKurz, heuteIso } from '../../lib/datum'

const STATUS_TEXT = {
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  offen: 'Noch offen',
}

const KOMMENTAR_MAX = 300

function SpieltagKarte({ spieltag, token, spielerId, vergangen = false }) {
  const [status, setStatus] = useState('offen')
  const [kommentar, setKommentar] = useState('')
  const [gespeicherterKommentar, setGespeicherterKommentar] = useState('')
  const [speichern, setSpeichern] = useState(null)
  const [fehler, setFehler] = useState(null)
  const [meinePosition, setMeinePosition] = useState(null)

  useEffect(() => {
    const ref = doc(db, 'spieltage', spieltag.id, 'verfuegbarkeit', token)
    const unsubscribe = onSnapshot(ref, (snap) => {
      const daten = snap.exists() ? snap.data() : null
      setStatus(daten?.status || 'offen')
      setGespeicherterKommentar(daten?.kommentar || '')
      // Lokale Eingabe nicht überschreiben, solange der Spieler tippt –
      // nur beim ersten Laden bzw. wenn das Feld noch unangetastet ist.
      setKommentar((aktuell) => (aktuell === '' ? daten?.kommentar || '' : aktuell))
    })
    return unsubscribe
  }, [spieltag.id, token])

  useEffect(() => {
    const ref = collection(db, 'spieltage', spieltag.id, 'aufstellung')
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const meine = snap.docs.find((d) => {
          const data = d.data()
          return data.bestaetigt && (data.spielerIds || []).includes(spielerId)
        })
        setMeinePosition(meine ? meine.id : null)
      },
      () => setMeinePosition(null),
    )
    return unsubscribe
  }, [spieltag.id, spielerId])

  async function schreibe(neuerStatus, neuerKommentar) {
    const daten = {
      status: neuerStatus,
      spielerId,
      zeitpunkt: serverTimestamp(),
    }
    const text = (neuerKommentar ?? '').trim().slice(0, KOMMENTAR_MAX)
    if (text) daten.kommentar = text
    await setDoc(doc(db, 'spieltage', spieltag.id, 'verfuegbarkeit', token), daten)
  }

  async function setzeStatus(neu) {
    setSpeichern(neu)
    setFehler(null)
    try {
      await schreibe(neu, kommentar)
    } catch (err) {
      console.error('Status konnte nicht gespeichert werden:', err)
      setFehler('Konnte nicht gespeichert werden. Bitte erneut versuchen.')
    } finally {
      setSpeichern(null)
    }
  }

  async function kommentarSpeichern() {
    setSpeichern('kommentar')
    setFehler(null)
    try {
      await schreibe(status, kommentar)
    } catch (err) {
      console.error('Kommentar konnte nicht gespeichert werden:', err)
      setFehler('Konnte nicht gespeichert werden. Bitte erneut versuchen.')
    } finally {
      setSpeichern(null)
    }
  }

  const gespielt = spieltag.status === 'gespielt'
  const ausgefallen = spieltag.status === 'ausgefallen'
  const ergebnis = spieltag.ergebnis || spieltag.ergebnisNuliga
  const fristUeberschritten =
    spieltag.antwortFrist && spieltag.antwortFrist < heuteIso() && status === 'offen'
  const kommentarGeaendert = kommentar.trim() !== gespeicherterKommentar

  return (
    <div className="spieltag-karte">
      <div className="spieltag-karte__kopf">
        <strong>
          {formatDatum(spieltag.datum)} · {spieltag.uhrzeit} Uhr
        </strong>
        <span className="hint">
          {spieltag.heimAuswaerts === 'heim' ? 'Heim' : 'Auswärts'} gegen {spieltag.gegner}
        </span>
      </div>

      {(spieltag.treffpunkt || spieltag.adresse) && (
        <div className="spieltag-karte__orga">
          {spieltag.treffpunkt && <span>Treffpunkt: {spieltag.treffpunkt}</span>}
          {spieltag.adresse && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spieltag.adresse)}`}
              target="_blank"
              rel="noreferrer"
            >
              {spieltag.adresse}
            </a>
          )}
        </div>
      )}

      {ausgefallen && <span className="status-badge status-badge--abgesagt">Spiel ausgefallen</span>}
      {gespielt && (
        <span className="status-badge status-badge--offen">
          Gespielt{ergebnis ? ` · Ergebnis ${ergebnis}` : ''}
        </span>
      )}
      {vergangen && !gespielt && !ausgefallen && (
        <span className="status-badge status-badge--offen">Termin vorbei</span>
      )}

      {!gespielt && !ausgefallen && !vergangen && (
        <>
          <span className={`status-badge status-badge--${status}`}>{STATUS_TEXT[status]}</span>

          {spieltag.antwortFrist && (
            <p className={fristUeberschritten ? 'form-error' : 'hint'} style={{ margin: 0 }}>
              Bitte bis {formatDatumKurz(spieltag.antwortFrist)} zu- oder absagen
              {fristUeberschritten ? ' – die Frist ist bereits vorbei!' : '.'}
            </p>
          )}

          <div className="spieltag-karte__aktionen">
            <button
              type="button"
              className={'btn-gross btn-gross--zusage' + (status === 'zugesagt' ? ' btn-gross--aktiv' : '')}
              disabled={!!speichern}
              onClick={() => setzeStatus('zugesagt')}
            >
              {speichern === 'zugesagt' ? '…' : '✓ Zusagen'}
            </button>
            <button
              type="button"
              className={'btn-gross btn-gross--absage' + (status === 'abgesagt' ? ' btn-gross--aktiv' : '')}
              disabled={!!speichern}
              onClick={() => setzeStatus('abgesagt')}
            >
              {speichern === 'abgesagt' ? '…' : '✕ Absagen'}
            </button>
            <button
              type="button"
              className={'btn-gross btn-gross--offen' + (status === 'offen' ? ' btn-gross--aktiv' : '')}
              disabled={!!speichern}
              onClick={() => setzeStatus('offen')}
            >
              {speichern === 'offen' ? '…' : '? Weiß noch nicht'}
            </button>
          </div>

          <div className="spieltag-karte__kommentar">
            <textarea
              rows={2}
              maxLength={KOMMENTAR_MAX}
              placeholder="Kommentar für den Mannschaftsführer (optional), z.B. „komme erst 14:30“"
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
            />
            {kommentarGeaendert && (
              <button
                type="button"
                className="btn btn--secondary btn--klein"
                disabled={!!speichern}
                onClick={kommentarSpeichern}
              >
                {speichern === 'kommentar' ? 'Speichern …' : 'Kommentar speichern'}
              </button>
            )}
          </div>
        </>
      )}

      {fehler && <p className="form-error">{fehler}</p>}

      {meinePosition && !ausgefallen && (
        <p className="spieltag-karte__aufstellung">
          Du bist eingeteilt: <strong>{meinePosition}</strong>
        </p>
      )}
    </div>
  )
}

export default SpieltagKarte
