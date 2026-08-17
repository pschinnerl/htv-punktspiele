import { useState } from 'react'

const leer = {
  datum: '',
  uhrzeit: '',
  heimAuswaerts: 'heim',
  gegner: '',
  antwortFrist: '',
  treffpunkt: '',
  adresse: '',
  ergebnis: '',
}

function SpieltagForm({ initial, onSpeichern, onAbbrechen, speichernText = 'Spieltag anlegen' }) {
  const [werte, setWerte] = useState(initial ? { ...leer, ...initial } : leer)
  const [mehrAnzeigen, setMehrAnzeigen] = useState(
    !!(initial?.antwortFrist || initial?.treffpunkt || initial?.adresse || initial?.ergebnis),
  )
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
        ...werte,
        gegner: werte.gegner.trim(),
        treffpunkt: werte.treffpunkt.trim(),
        adresse: werte.adresse.trim(),
        ergebnis: werte.ergebnis.trim(),
      })
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

      {!mehrAnzeigen && (
        <button
          type="button"
          className="btn btn--secondary btn--klein"
          onClick={() => setMehrAnzeigen(true)}
        >
          + Treffpunkt / Frist / Ergebnis
        </button>
      )}

      {mehrAnzeigen && (
        <>
          <label className="field">
            <span>Rückmeldung bis (optional)</span>
            <input
              type="date"
              value={werte.antwortFrist}
              onChange={(e) => setFeld('antwortFrist', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Treffpunkt (optional)</span>
            <input
              value={werte.treffpunkt}
              onChange={(e) => setFeld('treffpunkt', e.target.value)}
              placeholder="z.B. 12:30 am Vereinsheim"
            />
          </label>
          <label className="field">
            <span>Adresse der Anlage (optional)</span>
            <input
              value={werte.adresse}
              onChange={(e) => setFeld('adresse', e.target.value)}
              placeholder="Straße, Ort – wird als Karten-Link angezeigt"
            />
          </label>
          <label className="field">
            <span>Ergebnis (optional)</span>
            <input
              value={werte.ergebnis}
              onChange={(e) => setFeld('ergebnis', e.target.value)}
              placeholder="z.B. 5:4"
            />
          </label>
        </>
      )}

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
