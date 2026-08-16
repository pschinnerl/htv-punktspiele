import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'

function formatDatum(datum) {
  if (!datum) return ''
  const [jahr, monat, tag] = datum.split('-')
  return `${tag}.${monat}.${jahr}`
}

const STATUS_TEXT = {
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  offen: 'Noch offen',
}

function SpieltagKarte({ spieltag, token, spielerId }) {
  const [status, setStatus] = useState('offen')
  const [speichern, setSpeichern] = useState(null)
  const [fehler, setFehler] = useState(null)
  const [meinePosition, setMeinePosition] = useState(null)

  useEffect(() => {
    const ref = doc(db, 'spieltage', spieltag.id, 'verfuegbarkeit', token)
    const unsubscribe = onSnapshot(ref, (snap) => {
      setStatus(snap.exists() ? snap.data().status : 'offen')
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

  async function setzeStatus(neu) {
    setSpeichern(neu)
    setFehler(null)
    try {
      await setDoc(doc(db, 'spieltage', spieltag.id, 'verfuegbarkeit', token), {
        status: neu,
        spielerId,
        zeitpunkt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Status konnte nicht gespeichert werden:', err)
      setFehler('Konnte nicht gespeichert werden. Bitte erneut versuchen.')
    } finally {
      setSpeichern(null)
    }
  }

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

      <span className={`status-badge status-badge--${status}`}>{STATUS_TEXT[status]}</span>

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
      </div>

      {fehler && <p className="form-error">{fehler}</p>}

      {meinePosition && (
        <p className="spieltag-karte__aufstellung">
          Du bist eingeteilt: <strong>{meinePosition}</strong>
        </p>
      )}
    </div>
  )
}

export default SpieltagKarte
