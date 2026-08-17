import { useState } from 'react'
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore'
import QRCode from 'qrcode'
import { db } from '../../firebase'
import { useSpieler } from '../../hooks/useSpieler'
import { erzeugeToken } from '../../lib/token'
import { rangFuerTeam } from '../../lib/spieler'

function spielerLink(token) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/s/${token}`
}

function SpielerForm({ onSpeichern, initial, onAbbrechen, speichernText = 'Spieler anlegen' }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [rang, setRang] = useState(
    initial?.meldelisteRang !== undefined ? String(initial.meldelisteRang) : '',
  )
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState(null)

  async function absenden(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichern(true)
    try {
      await onSpeichern({ name: name.trim(), meldelisteRang: Number(rang) })
      if (!initial) {
        setName('')
        setRang('')
      }
    } catch (err) {
      console.error('Spieler konnte nicht gespeichert werden:', err)
      setFehler('Spieler konnte nicht gespeichert werden.')
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vor- und Nachname"
        />
      </label>
      <label className="field">
        <span>Meldelisten-Rang</span>
        <input
          required
          type="number"
          min="1"
          value={rang}
          onChange={(e) => setRang(e.target.value)}
          placeholder="z.B. 1"
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

function Spieler({ teamId, teamName }) {
  const { spieler, loading, fehler } = useSpieler(teamId)
  const [kopiertId, setKopiertId] = useState(null)
  const [bearbeiteId, setBearbeiteId] = useState(null)
  const [neuerLink, setNeuerLink] = useState(null)
  const [aktionsFehler, setAktionsFehler] = useState(null)
  const [qr, setQr] = useState(null) // { spielerId, dataUrl }

  // Spieler und Zugangs-Token werden gemeinsam in einem Batch angelegt, damit
  // nie ein Spieler ohne gültigen Link (oder umgekehrt) entsteht.
  async function anlegen({ name, meldelisteRang }) {
    const token = erzeugeToken()
    const spielerRef = doc(collection(db, 'spieler'))
    const zugangRef = doc(db, 'zugang', token)

    const batch = writeBatch(db)
    batch.set(spielerRef, {
      name,
      meldelisteRang,
      teamIds: [teamId],
      zugangsToken: token,
    })
    batch.set(zugangRef, { spielerId: spielerRef.id, teamIds: [teamId] })
    await batch.commit()

    setNeuerLink(spielerLink(token))
  }

  // Der Rang wird sowohl im Hauptfeld als auch teambezogen gespeichert,
  // damit Spieler mit mehreren Mannschaften pro Team den richtigen Rang haben.
  async function speichernBearbeitung(id, { name, meldelisteRang }) {
    await updateDoc(doc(db, 'spieler', id), {
      name,
      meldelisteRang,
      [`meldelisteRaenge.${teamId}`]: meldelisteRang,
    })
    setBearbeiteId(null)
  }

  // Beim Löschen muss auch der Zugangs-Eintrag verschwinden, sonst bliebe der
  // Spieler-Link weiter gültig.
  async function loeschen(s) {
    setAktionsFehler(null)
    if (
      !window.confirm(
        `Spieler „${s.name}“ wirklich löschen? Der bereits verschickte Zugangs-Link wird damit ungültig.`,
      )
    ) {
      return
    }
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'spieler', s.id))
      if (s.zugangsToken) {
        batch.delete(doc(db, 'zugang', s.zugangsToken))
      }
      await batch.commit()
    } catch (err) {
      console.error('Spieler konnte nicht gelöscht werden:', err)
      setAktionsFehler('Spieler konnte nicht gelöscht werden.')
    }
  }

  // Erzeugt einen neuen Zugangs-Token, z.B. wenn ein Link versehentlich
  // weitergegeben wurde. Der alte Link wird im selben Batch ungültig.
  async function linkErneuern(s) {
    setAktionsFehler(null)
    if (
      !window.confirm(
        `Neuen Link für „${s.name}“ erzeugen? Der bisherige Link funktioniert danach nicht mehr.`,
      )
    ) {
      return
    }
    try {
      const token = erzeugeToken()
      const batch = writeBatch(db)
      if (s.zugangsToken) {
        batch.delete(doc(db, 'zugang', s.zugangsToken))
      }
      batch.set(doc(db, 'zugang', token), {
        spielerId: s.id,
        teamIds: s.teamIds || [teamId],
      })
      batch.update(doc(db, 'spieler', s.id), { zugangsToken: token })
      await batch.commit()
      setNeuerLink(spielerLink(token))
      setQr(null)
    } catch (err) {
      console.error('Link konnte nicht erneuert werden:', err)
      setAktionsFehler('Der Link konnte nicht erneuert werden.')
    }
  }

  async function kopieren(token, id) {
    try {
      await navigator.clipboard.writeText(spielerLink(token))
      setKopiertId(id)
      setTimeout(() => setKopiertId(null), 1500)
    } catch {
      window.prompt('Link zum Kopieren markieren:', spielerLink(token))
    }
  }

  // Zeigt den Spieler-Link als QR-Code – praktisch zum Abfotografieren im
  // Vereinsheim oder beim Training.
  async function qrAnzeigen(s) {
    if (qr?.spielerId === s.id) {
      setQr(null)
      return
    }
    try {
      const dataUrl = await QRCode.toDataURL(spielerLink(s.zugangsToken), {
        width: 240,
        margin: 1,
      })
      setQr({ spielerId: s.id, dataUrl, name: s.name })
    } catch (err) {
      console.error('QR-Code konnte nicht erzeugt werden:', err)
      setAktionsFehler('Der QR-Code konnte nicht erzeugt werden.')
    }
  }

  return (
    <section className="card">
      <h2>Spieler{teamName ? ` – ${teamName}` : ''}</h2>

      <SpielerForm onSpeichern={anlegen} />

      {neuerLink && (
        <p className="hint">
          Link erzeugt: <code>{neuerLink}</code>
        </p>
      )}

      {loading && <p className="hint">Lade …</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      {aktionsFehler && <p className="form-error">{aktionsFehler}</p>}
      {!loading && !fehler && spieler.length === 0 && (
        <p className="hint">Noch keine Spieler in diesem Team.</p>
      )}

      <ul className="spieler-list">
        {spieler.map((s) =>
          bearbeiteId === s.id ? (
            <li key={s.id} className="spieler-list__item spieler-list__item--bearbeiten">
              <SpielerForm
                initial={{ name: s.name, meldelisteRang: rangFuerTeam(s, teamId) }}
                speichernText="Speichern"
                onSpeichern={(werte) => speichernBearbeitung(s.id, werte)}
                onAbbrechen={() => setBearbeiteId(null)}
              />
            </li>
          ) : (
            <li key={s.id} className="spieler-list__item">
              <div>
                <strong>
                  {rangFuerTeam(s, teamId)}. {s.name}
                </strong>
                {s.lk && <span className="hint spieler-list__lk">{s.lk}</span>}
              </div>
              <div className="spieler-list__actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--klein"
                  onClick={() => kopieren(s.zugangsToken, s.id)}
                >
                  {kopiertId === s.id ? 'Kopiert ✓' : 'Link kopieren'}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--klein"
                  onClick={() => qrAnzeigen(s)}
                >
                  {qr?.spielerId === s.id ? 'QR schließen' : 'QR-Code'}
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
                  onClick={() => linkErneuern(s)}
                >
                  Link erneuern
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--klein"
                  onClick={() => loeschen(s)}
                >
                  Löschen
                </button>
              </div>
              {qr?.spielerId === s.id && (
                <div className="spieler-list__qr">
                  <img src={qr.dataUrl} alt={`QR-Code für ${qr.name}`} />
                  <span className="hint">Spieler-Link für {qr.name} – zum Abfotografieren</span>
                </div>
              )}
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

export default Spieler
