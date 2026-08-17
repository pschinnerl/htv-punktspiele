// Öffentlich erreichbarer Datenschutzhinweis (auch ohne Anmeldung), damit er
// aus der Spieler-Ansicht heraus verlinkt werden kann.
function Datenschutz() {
  return (
    <div className="page">
      <h1>Datenschutzhinweis</h1>
      <p className="hint">
        Informationen nach Art. 13 DSGVO zur Nutzung der Punktspiel-App des Helmstedter
        Tennis-Vereins e.V.
      </p>

      <section className="card">
        <h2>Verantwortlich</h2>
        <p>
          Helmstedter Tennis-Verein e.V., vertreten durch den Vorstand.
          <br />
          Kontakt für Fragen zum Datenschutz: <a href="mailto:vorstand.htv@gmail.com">
            vorstand.htv@gmail.com
          </a>
        </p>
      </section>

      <section className="card">
        <h2>Welche Daten werden verarbeitet?</h2>
        <ul>
          <li>
            <strong>Mannschaft und Spielplan:</strong> Mannschaftsname, Liga, Saison,
            Spieltermine, Gegner, Ergebnisse und Ligatabellen. Diese Daten stammen aus den
            öffentlich zugänglichen nuLiga-Seiten des Tennisverbandes.
          </li>
          <li>
            <strong>Spielerdaten:</strong> Vor- und Nachname, Meldelisten-Rang und – sofern
            in nuLiga veröffentlicht – die Leistungsklasse.
          </li>
          <li>
            <strong>Rückmeldungen:</strong> Zu- oder Absage zu einem Spieltag, der Zeitpunkt
            der Antwort und ein freiwillig eingegebener Kommentar.
          </li>
          <li>
            <strong>Aufstellungen:</strong> Welche Spieler für welche Position vorgesehen
            bzw. bestätigt sind.
          </li>
          <li>
            <strong>Zugangsdaten:</strong> Für Mannschaftsführer und Vorstand eine
            E-Mail-Adresse mit Passwort; für Spieler ein zufällig erzeugter Zugangslink ohne
            persönliche Anmeldung.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Zweck und Rechtsgrundlage</h2>
        <p>
          Die Daten werden ausschließlich zur Organisation des Mannschafts-Spielbetriebs
          verarbeitet – also um Verfügbarkeiten abzufragen und Aufstellungen zu planen.
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und f DSGVO (Durchführung der
          Mitgliedschaft und berechtigtes Interesse des Vereins an einem geordneten
          Spielbetrieb). Es findet keine Werbung, keine Auswertung zu anderen Zwecken und
          keine Weitergabe an Dritte zu Werbezwecken statt.
        </p>
      </section>

      <section className="card">
        <h2>Wer kann was sehen?</h2>
        <ul>
          <li>
            <strong>Spieler</strong> sehen ausschließlich ihre eigenen Spieltage, ihre eigene
            Rückmeldung, bestätigte Aufstellungen und die öffentliche Ligatabelle – nicht die
            Rückmeldungen anderer.
          </li>
          <li>
            <strong>Mannschaftsführer</strong> sehen die Daten der von ihnen betreuten
            Mannschaften.
          </li>
          <li>
            <strong>Der Vorstand</strong> hat Zugriff auf alle Mannschaften.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Speicherung und Auftragsverarbeitung</h2>
        <p>
          Die Daten liegen in der Datenbank „Firestore“ des Anbieters Google (Firebase),
          Speicherort Europa. Mit Google besteht das Standard-Auftragsverarbeitungsverhältnis
          der Firebase-Nutzungsbedingungen. Die Anwendung selbst wird über GitHub Pages
          bereitgestellt; dabei verarbeitet GitHub technisch notwendige Verbindungsdaten wie
          die IP-Adresse. Es werden keine Cookies zu Analyse- oder Werbezwecken gesetzt und
          keine Tracking-Dienste eingebunden.
        </p>
      </section>

      <section className="card">
        <h2>Speicherdauer</h2>
        <p>
          Rückmeldungen und Aufstellungen werden für die laufende Saison gespeichert und
          anschließend gelöscht oder mit der neuen Saison überschrieben. Scheidet ein
          Spieler aus der Mannschaft aus, werden seine Daten mit dem nächsten Abgleich der
          Meldeliste entfernt; sein Zugangslink verliert damit seine Gültigkeit.
        </p>
      </section>

      <section className="card">
        <h2>Rechte der Betroffenen</h2>
        <p>
          Es besteht das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei
          der zuständigen Aufsichtsbehörde (Landesbeauftragte für den Datenschutz
          Niedersachsen). Für alle diese Anliegen genügt eine formlose Nachricht an den
          Vorstand.
        </p>
      </section>

      <p className="hint">
        Für Jugendmannschaften gilt: Der Zugangslink wird an die Erziehungsberechtigten
        ausgegeben; die Rückmeldung erfolgt durch sie.
      </p>
    </div>
  )
}

export default Datenschutz
