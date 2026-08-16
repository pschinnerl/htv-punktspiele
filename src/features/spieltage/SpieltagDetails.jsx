import { useEffect, useState } from 'react'
import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase'
import { useSpieler } from '../../hooks/useSpieler'
import { useVerfuegbarkeit } from '../../hooks/useVerfuegbarkeit'
import { useAufstellung } from '../../hooks/useAufstellung'
import { nachRang, rangFuerTeam } from '../../lib/spieler'

const STATUS_TEXT = {
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
}

function neueZeile() {
  return { id: null, label: '', spieler1: '', spieler2: '', bestaetigt: false }
}

function SpieltagDetails({ spieltag, teamId }) {
  const { spieler } = useSpieler(teamId)
  const { karte: verfuegbarkeit, loading: ladeVerf } = useVerfuegbarkeit(spieltag.id)
  const { positionen, loading: ladeAufstellung } = useAufstellung(spieltag.id)

  // null = Bearbeitungszeilen wurden noch nicht aus den geladenen
  // Positionen initialisiert; danach übernimmt der lokale State.
  const [zeilen, setZeilen] = useState(null)
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState(null)
  const [gespeichert, setGespeichert] = useState(false)

  useEffect(() => {
    if (zeilen === null && !ladeAufstellung) {
      if (positionen.length > 0) {
        setZeilen(
          positionen.map((p) => ({
            id: p.id,
            label: p.id,
            spieler1: (p.spielerIds || [])[0] || '',
            spieler2: (p.spielerIds || [])[1] || '',
            bestaetigt: !!p.bestaetigt,
          })),
        )
      } else {
        setZeilen([])
      }
    }
  }, [ladeAufstellung, positionen, zeilen])

  const zugesagt = spieler
    .filter((s) => verfuegbarkeit[s.id]?.status === 'zugesagt')
    .sort(nachRang(teamId))

  function vorschlagFuellen() {
    setZeilen(
      zugesagt.map((s, i) => ({
        id: null,
        label: `Position ${i + 1}`,
        spieler1: s.id,
        spieler2: '',
        bestaetigt: false,
      })),
    )
  }

  function zeileHinzufuegen() {
    setZeilen((z) => [...(z || []), neueZeile()])
  }

  function zeileAendern(index, feld, wert) {
    setZeilen((z) => z.map((zeile, i) => (i === index ? { ...zeile, [feld]: wert } : zeile)))
  }

  function zeileEntfernen(index) {
    setZeilen((z) => z.filter((_, i) => i !== index))
  }

  async function speichernAufstellung() {
    setFehler(null)
    setSpeichern(true)
    setGespeichert(false)
    try {
      const batch = writeBatch(db)
      const aktuelleIds = new Set()

      for (const zeile of zeilen) {
        const label = zeile.label.trim()
        if (!label || label.includes('/')) continue
        aktuelleIds.add(label)
        const spielerIds = [zeile.spieler1, zeile.spieler2].filter(Boolean)
        batch.set(doc(db, 'spieltage', spieltag.id, 'aufstellung', label), {
          spielerIds,
          bestaetigt: zeile.bestaetigt,
        })
      }

      // Entfernte Zeilen auch in Firestore löschen
      for (const p of positionen) {
        if (!aktuelleIds.has(p.id)) {
          batch.delete(doc(db, 'spieltage', spieltag.id, 'aufstellung', p.id))
        }
      }

      await batch.commit()
      setGespeichert(true)
      setTimeout(() => setGespeichert(false), 2000)
    } catch (err) {
      console.error('Aufstellung konnte nicht gespeichert werden:', err)
      setFehler('Aufstellung konnte nicht gespeichert werden.')
    } finally {
      setSpeichern(false)
    }
  }

  return (
    <div className="spieltag-details">
      <div className="spieltag-details__spalte">
        <h3>Verfügbarkeit</h3>
        {ladeVerf && <p className="hint">Lade …</p>}
        <ul className="verfuegbarkeit-liste">
          {spieler.map((s) => {
            const status = verfuegbarkeit[s.id]?.status
            return (
              <li key={s.id}>
                <span>
                  {rangFuerTeam(s, teamId)}. {s.name}
                </span>
                <span className={`status-badge status-badge--${status || 'offen'}`}>
                  {STATUS_TEXT[status] || 'Offen'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="spieltag-details__spalte">
        <h3>Aufstellung</h3>
        <p className="hint">
          Zugesagt (nach Rang): {zugesagt.map((s) => s.name).join(', ') || '–'}
        </p>

        <button
          type="button"
          className="btn btn--secondary btn--klein"
          onClick={vorschlagFuellen}
        >
          Vorschlag nach Rang übernehmen
        </button>

        {zeilen === null && <p className="hint">Lade …</p>}

        {zeilen && (
          <div className="aufstellung-zeilen">
            {zeilen.map((zeile, index) => (
              <div className="aufstellung-zeile" key={index}>
                <input
                  className="aufstellung-zeile__label"
                  value={zeile.label}
                  placeholder="z.B. Einzel 1"
                  disabled={!!zeile.id}
                  onChange={(e) => zeileAendern(index, 'label', e.target.value)}
                />
                <select
                  value={zeile.spieler1}
                  onChange={(e) => zeileAendern(index, 'spieler1', e.target.value)}
                >
                  <option value="">– Spieler 1 –</option>
                  {spieler.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={zeile.spieler2}
                  onChange={(e) => zeileAendern(index, 'spieler2', e.target.value)}
                >
                  <option value="">– Spieler 2 (Doppel) –</option>
                  {spieler.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label className="aufstellung-zeile__bestaetigt">
                  <input
                    type="checkbox"
                    checked={zeile.bestaetigt}
                    onChange={(e) => zeileAendern(index, 'bestaetigt', e.target.checked)}
                  />
                  Bestätigt
                </label>
                <button
                  type="button"
                  className="btn btn--secondary btn--klein"
                  onClick={() => zeileEntfernen(index)}
                >
                  Entfernen
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn--secondary btn--klein"
              onClick={zeileHinzufuegen}
            >
              + Position hinzufügen
            </button>
          </div>
        )}

        {fehler && <p className="form-error">{fehler}</p>}
        {gespeichert && <p className="hint">Gespeichert ✓</p>}

        <div className="spieltag-details__speichern">
          <button
            type="button"
            className="btn btn--primary"
            disabled={speichern || !zeilen}
            onClick={speichernAufstellung}
          >
            {speichern ? 'Speichern …' : 'Aufstellung speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SpieltagDetails
