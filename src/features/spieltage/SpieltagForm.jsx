import { useState } from 'react'

const leer = {
  datum: '',
  uhrzeit: '',
  heimAuswaerts: 'heim',
  gegner: '',
}

function SpieltagForm({ initial, onSpeichern, onAbbrechen, speichernText = 'Spieltag anlegen' }) {
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
      await onSpeichern(werte)
      if (!initial) {
        setWerte(leer)
      }
    } catch (err) {
      console.error('Spieltag konnte nicht gespeichert werden:', err)
      setFehler('Spieltag konnte nicht gespeichert werden.')
    } finally {
      setSpeichern(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={absenden}>
      <label className="field">
        <span>Datum</span>
        <input
          required
          type="date"
          value={werte.datum}
          onChange={(e) => setFeld('datum', e.target.value)}
        />
      </label>
      <label className="field">
        <span>Uhrzeit</span>
        <input
          required
          type="time"
          value={werte.uhrzeit}
          onChange={(e) => setFeld('uhrzeit', e.target.value)}
        />
      </label>
      <label className="field">
        <span>Heim/Auswärts</span>
        <select
          value={werte.heimAuswaerts}
          onChange={(e) => setFeld('heimAuswaerts', e.target.value)}
        >
          <option value="heim">Heim</option>
          <option value="auswaerts">Auswärts</option>
        </select>
      </label>
      <label className="field">
        <span>Gegner</span>
        <input
          required
          value={werte.gegner}
          onChange={(e) => setFeld('gegner', e.target.value)}
          placeholder="Name des Gegners"
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

export default SpieltagForm
