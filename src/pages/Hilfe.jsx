import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { VERSION_TEXT } from '../lib/version'

function Abschnitt({ titel, children }) {
  return (
    <details className="hilfe-abschnitt">
      <summary>{titel}</summary>
      <div className="hilfe-abschnitt__inhalt">{children}</div>
    </details>
  )
}

function Hilfe() {
  const { istVorstand } = useAuth()

  return (
    <div className="page">
      <h1>Hilfe</h1>
      <p className="hint">
        Kurzanleitung für Mannschaftsführer und Vorstand. Die Abschnitte lassen sich
        einzeln aufklappen. – {VERSION_TEXT}
      </p>

      <section className="card">
        <h2>In drei Schritten durch die Saison</h2>
        <ol className="hilfe-schritte">
          <li>
            <strong>Spieler-Links verteilen.</strong> Unter <Link to="/spieler">Spieler</Link>{' '}
            hat jeder Spieler einen persönlichen Link. Einmal pro Saison verschicken (oder
            QR-Code zeigen) – fertig.
          </li>
          <li>
            <strong>Rückmeldungen einsammeln.</strong> Die Spieler sagen über ihren Link zu
            oder ab. Unter <Link to="/spieltage">Spieltage</Link> → „Verfügbarkeit/Aufstellung“
            siehst du jederzeit den Stand.
          </li>
          <li>
            <strong>Aufstellung festlegen.</strong> „Vorschlag nach Rang übernehmen“, bei
            Bedarf anpassen, Häkchen „Bestätigt“ setzen und speichern. Bestätigte Positionen
            sieht der Spieler in seiner Ansicht.
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Fragen und Antworten</h2>

        <Abschnitt titel="Woher kommen Mannschaften, Spielpläne und Tabellen?">
          <p>
            Jede Nacht liest die App automatisch die öffentlichen nuLiga-Seiten des Vereins
            und übernimmt Mannschaften, Spieltermine, Meldelisten und Ligatabellen. Du musst
            also normalerweise nichts von Hand anlegen. Ergebnisse gespielter Begegnungen
            kommen ebenfalls von dort.
          </p>
          <p>
            Von Hand angelegte Spieltage und Spieler bleiben dabei unangetastet – die
            Synchronisation fasst nur ihre eigenen Einträge an.
          </p>
        </Abschnitt>

        <Abschnitt titel="Ein Spieler hat seinen Link verloren">
          <p>
            Unter <Link to="/spieler">Spieler</Link> auf „Link kopieren“ tippen und den Link
            erneut schicken; „QR-Code“ zeigt ihn zum Abfotografieren. Der Link bleibt die
            ganze Saison gültig.
          </p>
          <p>
            Ist ein Link versehentlich an Fremde geraten, erzeugt „Link erneuern“ einen
            neuen. Der alte funktioniert danach nicht mehr – der Spieler braucht also den
            neuen Link.
          </p>
        </Abschnitt>

        <Abschnitt titel="Wie erinnere ich an fehlende Rückmeldungen?">
          <p>
            Beim Spieltag unter „Verfügbarkeit/Aufstellung“ gibt es den Knopf
            „Erinnerungstext kopieren“. Er erzeugt eine fertige Nachricht mit Termin,
            Treffpunkt und den Namen aller, die noch nicht geantwortet haben – zum Einfügen
            in die WhatsApp-Gruppe.
          </p>
          <p>
            Trägst du beim Spieltag zusätzlich eine <em>Rückmeldefrist</em> ein, sehen die
            Spieler diese in ihrer Ansicht und werden nach Ablauf deutlich darauf
            hingewiesen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Was bedeuten die gelben Warnhinweise bei der Aufstellung?">
          <p>
            Die App prüft die Aufstellung gegen die üblichen Regeln der Wettspielordnung und
            weist hin auf: Einzel außerhalb der Meldelisten-Reihenfolge, Doppel mit
            ungünstiger Rangsumme, mehrfach eingeteilte Spieler und Spieler ohne Zusage.
          </p>
          <p>
            Die Hinweise <strong>blockieren nichts</strong> – es gibt begründete Ausnahmen.
            Sie sollen nur verhindern, dass ein Aufstellungsfehler übersehen wird. Im
            Zweifel gilt immer die Wettspielordnung des Verbandes, nicht die App.
          </p>
        </Abschnitt>

        <Abschnitt titel="Treffpunkt, Adresse und Ergebnis eintragen">
          <p>
            Beim Anlegen oder Bearbeiten eines Spieltags auf „+ Treffpunkt / Frist /
            Ergebnis“ klicken. Der Treffpunkt und die Adresse erscheinen in der
            Spieler-Ansicht, die Adresse zusätzlich als Karten-Link – praktisch bei
            Auswärtsspielen.
          </p>
        </Abschnitt>

        <Abschnitt titel="Was sehen die Spieler?">
          <p>
            Nur ihre eigenen Spieltage, ihre eigene Rückmeldung, bestätigte Aufstellungen und
            die Ligatabelle. Sie sehen <strong>nicht</strong>, wer sonst zu- oder abgesagt
            hat, und können nichts verändern außer ihrer eigenen Antwort.
          </p>
        </Abschnitt>

        <Abschnitt titel="App auf dem Handy „installieren“">
          <p>
            Die Seite im Handy-Browser öffnen und im Menü „Zum Home-Bildschirm hinzufügen“
            wählen. Danach startet die App wie eine normale App aus einem eigenen Symbol –
            ganz ohne App Store. Das funktioniert für die Verwaltung genauso wie für die
            Spieler-Links.
          </p>
        </Abschnitt>

        <Abschnitt titel="Spieltage in den eigenen Kalender übernehmen">
          <p>
            In der Spieler-Ansicht gibt es oben den Knopf „📅 Spieltage in meinen Kalender
            übernehmen“. Er lädt eine Kalenderdatei mit allen kommenden Spieltagen herunter,
            die sich in Apple Kalender, Google Kalender oder Outlook öffnen lässt. Die
            Erinnerung vor dem Spiel übernimmt dann der Kalender des Handys.
          </p>
          <p className="hint">
            Hinweis: Das ist eine einmalige Übernahme, kein laufendes Abo. Nach Terminänderungen
            (z.B. verlegten Spielen) am besten erneut übernehmen.
          </p>
        </Abschnitt>

        {istVorstand && (
          <Abschnitt titel="Neuen Mannschaftsführer anlegen (nur Vorstand)">
            <ol>
              <li>
                In der{' '}
                <a
                  href="https://console.firebase.google.com/project/htv-punktspiele/authentication/users"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firebase Console → Authentication
                </a>{' '}
                auf „Nutzer hinzufügen“, E-Mail und ein Startpasswort vergeben.
              </li>
              <li>
                In der Liste die <strong>Benutzer-UID</strong> kopieren (langer Buchstaben-
                und Zahlencode).
              </li>
              <li>
                Hier in der App unter <Link to="/rollen">Zugänge</Link> die UID einfügen,
                Rolle wählen und die betreuten Mannschaften ankreuzen.
              </li>
            </ol>
            <p className="hint">
              Der neue Mannschaftsführer kann sein Passwort danach selbst über „Passwort
              vergessen?“ auf der Anmeldeseite ändern.
            </p>
          </Abschnitt>
        )}

        <Abschnitt titel="Etwas funktioniert nicht">
          <p>
            Zuerst die Seite neu laden. Bleibt es dabei, hilft meist ein Blick auf die
            Rolle: Ohne Eintrag unter „Zugänge“ sieht man keine Daten. Fehlen Spieltage oder
            Tabellen, hat vermutlich die nächtliche nuLiga-Synchronisation nicht
            durchgelaufen – sie wird am nächsten Tag automatisch erneut versucht.
          </p>
          <p>
            Technische Details, Zugangsdaten und Wartungsaufgaben stehen in der
            Verfahrensdokumentation des Vereins.
          </p>
        </Abschnitt>
      </section>
    </div>
  )
}

export default Hilfe
