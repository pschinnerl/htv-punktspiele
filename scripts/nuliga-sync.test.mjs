// Tests für die Parser-Funktionen der nuLiga-Synchronisation.
// Bewusst ohne Test-Framework, damit kein zusätzliches Paket nötig ist:
//   npm run test:nuliga-parser
import { spieleZusammenfuehren } from './nuliga-sync.js'
import {
  parseSpielplanHtml,
  parseVereinsseite,
  parseGruppenLink,
  parseMeldeliste,
  parseTabelle,
  normalisiereTeamName,
  normalisiereSpielerName,
  namensSchluessel,
} from './nuliga-parser.js'

let fehler = 0

function pruefe(bezeichnung, bedingung, details) {
  if (bedingung) {
    console.log(`  ok  – ${bezeichnung}`)
  } else {
    fehler += 1
    console.error(`  FEHLER – ${bezeichnung}`)
    if (details !== undefined) console.error('        ', JSON.stringify(details))
  }
}

// ---------------------------------------------------------------------------
// Mannschaftsseite (teamPortrait): enthält Spielplan UND Meldeliste.
// Die Meldeliste hat mehr Zeilen als der Spielplan – ein Parser, der einfach
// "die größte Tabelle" nimmt, findet hier keine Begegnungen. Genau dieser
// Fall ist in der Praxis aufgetreten und wird hier abgesichert.
// ---------------------------------------------------------------------------
const teamPortraitHtml = `
<html><body>
  <table class="result-set">
    <tr><td>Mannschaft</td><td>Helmstedter TV</td></tr>
    <tr><td>Liga</td><td><a href="/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/groupPage?targetFed=TNB&championship=TNB+Sommer+2026&group=476">Herren 40 2. Regionsklasse Gr. 476</a></td></tr>
  </table>

  <table class="result-set">
    <tr><th>Datum</th><th>Heimmannschaft</th><th>Gastmannschaft</th><th>Matchpunkte</th><th>Sätze</th><th>Spiele</th><th>Spielbericht</th></tr>
    <tr><td>Sa.</td><td>09.05.2026 15:00</td><td></td><td>Helmstedter TV</td><td>TC Fallersleben III</td><td>4:2</td><td>8:4</td><td>56:36</td><td><a href="/wa/report?id=1">anzeigen</a></td></tr>
    <tr><td>Sa.</td><td>20.06.2026 10:00</td><td></td><td>TSG Mörse</td><td>Helmstedter TV</td><td>2:4</td><td>4:9</td><td>49:67</td><td><a href="/wa/report?id=2">anzeigen</a></td></tr>
    <tr><td>So.</td><td>27.09.2026 10:00</td><td></td><td>Helmstedter TV</td><td>TC Fallersleben II</td><td></td><td></td><td></td><td>offen</td></tr>
  </table>

  <table class="result-set">
    <tr><th>Rang</th><th>LK</th><th>ID-Nummer</th><th>Name, Vorname</th><th>Nation</th><th>Info</th><th>SG</th><th>Einzel</th><th>Doppel</th><th>gesamt</th></tr>
    <tr><td>1</td><td>LK14,4</td><td>10900765</td><td><a href="/wa/p?p=1">Stanek, Jan (2009)</a></td><td></td><td></td><td></td><td>2:2</td><td>4:0</td><td>6:2</td></tr>
    <tr><td>2</td><td>LK14,8</td><td>18156173</td><td><a href="/wa/p?p=2">Quoll, Malte (1981)</a></td><td></td><td></td><td></td><td>4:0</td><td>3:2</td><td>7:2</td></tr>
    <tr><td>3</td><td>LK16,1</td><td>17553195</td><td><a href="/wa/p?p=3">Dr. Stanek, Emanuel (1975)</a></td><td>CZE</td><td></td><td></td><td>3:1</td><td>4:0</td><td>7:1</td></tr>
    <tr><td>4</td><td>LK20,0</td><td>17553196</td><td><a href="/wa/p?p=4">Gulaneck, Frank (1960)</a></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>5</td><td>LK20,4</td><td>17553197</td><td><a href="/wa/p?p=5">Hellmich, Ralf (1961)</a></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
  </table>
</body></html>
`

console.log('\nSpielplan (teamPortrait):')
const spiele = parseSpielplanHtml(teamPortraitHtml, 'Helmstedter')
console.log(JSON.stringify(spiele, null, 2))
pruefe('genau 3 Begegnungen erkannt', spiele.length === 3, spiele)
pruefe(
  'Heimspiel korrekt erkannt (eigene Mannschaft ist hier NICHT verlinkt)',
  spiele[0]?.datum === '2026-05-09' &&
    spiele[0]?.heimAuswaerts === 'heim' &&
    spiele[0]?.gegner === 'TC Fallersleben III' &&
    spiele[0]?.uhrzeit === '15:00' &&
    spiele[0]?.status === 'gespielt' &&
    spiele[0]?.ergebnisNuliga === '4:2',
  spiele[0],
)
pruefe(
  'Auswärtsspiel korrekt erkannt',
  spiele[1]?.heimAuswaerts === 'auswaerts' &&
    spiele[1]?.gegner === 'TSG Mörse' &&
    spiele[1]?.ergebnisNuliga === '2:4',
  spiele[1],
)
pruefe(
  'noch nicht gespielte Begegnung bleibt "geplant"',
  spiele[2]?.datum === '2026-09-27' &&
    spiele[2]?.status === 'geplant' &&
    spiele[2]?.ergebnisNuliga === null,
  spiele[2],
)
pruefe(
  'Uhrzeit wird aus dem kombinierten Datumsfeld gelesen',
  spiele.every((s) => !s.uhrzeitFehlt),
  spiele.map((s) => s.uhrzeit),
)
pruefe(
  'kein Spieler aus der Meldeliste als Gegner missverstanden',
  !spiele.some((s) => /Quoll|Stanek|Gulaneck/.test(s.gegner)),
  spiele.map((s) => s.gegner),
)
pruefe(
  '"anzeigen" wird nicht für einen Mannschaftsnamen gehalten',
  !spiele.some((s) => /anzeigen/i.test(s.gegner)),
  spiele.map((s) => s.gegner),
)

console.log('\nMeldeliste:')
const meldeliste = parseMeldeliste(teamPortraitHtml)
pruefe('5 Spieler erkannt', meldeliste.length === 5, meldeliste.length)
pruefe(
  'Rang, Name und LK korrekt',
  meldeliste[0]?.meldelisteRang === 1 &&
    meldeliste[0]?.name === 'Jan Stanek' &&
    meldeliste[0]?.lk === 'LK 14,4',
  meldeliste[0],
)
pruefe(
  'Titel bleibt vorne stehen',
  meldeliste[2]?.name === 'Dr. Emanuel Stanek',
  meldeliste[2]?.name,
)
pruefe(
  'Spieler ohne Ergebnisse werden ebenfalls erkannt',
  meldeliste[3]?.name === 'Frank Gulaneck' && meldeliste[4]?.name === 'Ralf Hellmich',
  meldeliste.slice(3),
)
pruefe(
  'keine Spielplanzeile als Spieler missverstanden',
  !meldeliste.some((s) => /Helmstedter|Fallersleben|Mörse/.test(s.name)),
  meldeliste.map((s) => s.name),
)

console.log('\nLink zur Ligatabelle:')
const gruppe = parseGruppenLink(teamPortraitHtml, 'https://tnb.liga.nu/cgi-bin/x')
pruefe(
  'groupPage-Link gefunden und absolut',
  gruppe?.url.startsWith('https://tnb.liga.nu/cgi-bin/WebObjects/') &&
    gruppe?.name === 'Herren 40 2. Regionsklasse Gr. 476',
  gruppe,
)

// ---------------------------------------------------------------------------
// Ligatabelle (groupPage)
// ---------------------------------------------------------------------------
const groupPageHtml = `
<html><body>
  <table class="result-set">
    <tr><th></th><th>Rang</th><th>Mannschaft</th><th>Begegnungen</th><th>S</th><th>U</th><th>N</th>
        <th>Tab.Punkte</th><th>Matchpunkte</th><th>Sätze</th><th>Spiele</th></tr>
    <tr><td></td><td>1</td><td><a href="/wa/teamPortrait?team=1">Helmstedter TV</a></td><td>5</td><td>5</td><td>0</td><td>0</td><td>10:0</td><td>28:2</td><td>57:6</td><td>347:99</td></tr>
    <tr><td></td><td>2</td><td><a href="/wa/teamPortrait?team=4">TC Fallersleben II</a></td><td>5</td><td>4</td><td>0</td><td>1</td><td>8:2</td><td>21:9</td><td>43:23</td><td>301:219</td></tr>
    <tr><td></td><td>3</td><td><a href="/wa/teamPortrait?team=5">TC Schwülper</a></td><td>5</td><td>3</td><td>0</td><td>2</td><td>6:4</td><td>21:9</td><td>44:21</td><td>295:196</td></tr>
  </table>

  <table class="result-set">
    <tr><th>Datum</th><th>Heimmannschaft</th><th>Gastmannschaft</th><th>Matchpunkte</th><th>Sätze</th><th>Spiele</th><th>Spielbericht</th></tr>
    <tr><td>So.</td><td>03.05.2026 14:00</td><td></td><td><a href="/wa/t?t=1">Helmstedter TV</a></td><td><a href="/wa/t?t=3">TB Wendhausen</a></td><td>6:0</td><td>12:0</td><td>72:5</td><td><a href="/wa/r?id=9">anzeigen</a></td></tr>
    <tr><td>So.</td><td>03.05.2026 13:00</td><td></td><td><a href="/wa/t?t=5">TC Schwülper</a></td><td><a href="/wa/t?t=4">TC Fallersleben II</a></td><td>6:0</td><td>12:1</td><td>74:32</td><td><a href="/wa/r?id=8">anzeigen</a></td></tr>
    <tr><td></td><td></td><td></td><td><a href="/wa/t?t=1">Helmstedter TV</a></td><td><a href="/wa/t?t=4">TC Fallersleben II</a></td><td></td><td></td><td></td><td>ursprünglich am 30.08. 09:00</td></tr>
  </table>
</body></html>
`

console.log('\nLigatabelle (groupPage):')
const tabelle = parseTabelle(groupPageHtml)
console.log(JSON.stringify(tabelle, null, 2))
pruefe('3 Tabellenzeilen erkannt', tabelle.length === 3, tabelle.length)
pruefe(
  'erste Zeile vollständig',
  tabelle[0]?.rang === 1 &&
    tabelle[0]?.mannschaft === 'Helmstedter TV' &&
    tabelle[0]?.begegnungen === 5 &&
    tabelle[0]?.siege === 5 &&
    tabelle[0]?.unentschieden === 0 &&
    tabelle[0]?.niederlagen === 0 &&
    tabelle[0]?.punkte === '10:0' &&
    tabelle[0]?.matchpunkte === '28:2' &&
    tabelle[0]?.saetze === '57:6' &&
    tabelle[0]?.spiele === '347:99',
  tabelle[0],
)
pruefe(
  'Satzverhältnisse werden nicht als Uhrzeit verworfen (z.B. 43:23)',
  tabelle[1]?.saetze === '43:23' && tabelle[1]?.spiele === '301:219',
  tabelle[1],
)
pruefe(
  'auch die letzte Zeile ist vollständig',
  tabelle[2]?.rang === 3 &&
    tabelle[2]?.mannschaft === 'TC Schwülper' &&
    tabelle[2]?.punkte === '6:4' &&
    tabelle[2]?.matchpunkte === '21:9' &&
    tabelle[2]?.saetze === '44:21' &&
    tabelle[2]?.spiele === '295:196',
  tabelle[2],
)
pruefe(
  'Spielplanzeilen erzeugen keine Tabellenzeilen',
  parseTabelle(teamPortraitHtml).length === 0,
  parseTabelle(teamPortraitHtml),
)
pruefe(
  'Tabellenzeilen erzeugen keine Meldelisten-Einträge',
  parseMeldeliste(groupPageHtml).length === 0,
  parseMeldeliste(groupPageHtml),
)

// ---------------------------------------------------------------------------
// Zusammenführen beider Quellen
// ---------------------------------------------------------------------------
console.log('\nZusammenführen von Mannschafts- und Ligaseite:')
const zusammen = spieleZusammenfuehren(
  parseSpielplanHtml(teamPortraitHtml, 'Helmstedter'),
  parseSpielplanHtml(groupPageHtml, 'Helmstedter'),
)
pruefe(
  'Begegnungen beider Seiten ergeben zusammen 4 (ohne Dopplungen)',
  zusammen.length === 4,
  zusammen.map((s) => `${s.datum} ${s.gegner}`),
)
pruefe(
  'nach Datum sortiert',
  zusammen.map((s) => s.datum).join(',') === '2026-05-03,2026-05-09,2026-06-20,2026-09-27',
  zusammen.map((s) => s.datum),
)
pruefe(
  'verlegte Begegnung ohne Datum erzeugt keinen Eintrag',
  !zusammen.some((s) => !s.datum),
  zusammen,
)

// ---------------------------------------------------------------------------
// Vereinsseite (clubTeams)
// ---------------------------------------------------------------------------
const clubTeamsHtml = `
<html><body>
  <table>
    <tr><th>Mannschaft</th><th>Liga</th></tr>
    <tr>
      <td><a href="/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/teamPortrait?team=3646350&championship=TNB+Sommer+2026">Herren 40 (4er)</a></td>
      <td>Herren 40 2. Regionsklasse Gr. 476</td>
    </tr>
    <tr>
      <td><a href="/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/teamPortrait?team=3646000&championship=TNB+Sommer+2026">Damen (4er)</a></td>
      <td>Damen Regionsliga Gr. 021</td>
    </tr>
    <tr>
      <td><a href="/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/teamPortrait?team=3999999&championship=TNB+Vereinspokal+2026">Mixed Offen LK 4,0-25,0</a></td>
      <td>X00 LK 4-25 HF SÜD</td>
    </tr>
  </table>
</body></html>
`

console.log('\nVereinsseite (clubTeams):')
const mannschaften = parseVereinsseite(
  clubTeamsHtml,
  'https://tnb.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/clubTeams?club=16367',
)
pruefe('3 Mannschaften gefunden', mannschaften.length === 3, mannschaften.length)
pruefe('"(4er)" wird entfernt', mannschaften[0]?.name === 'Herren 40', mannschaften[0]?.name)
pruefe(
  'Liga übernommen',
  mannschaften[0]?.liga === 'Herren 40 2. Regionsklasse Gr. 476',
  mannschaften[0]?.liga,
)
pruefe(
  'Saison aus dem Link gelesen',
  mannschaften[0]?.saison === 'TNB Sommer 2026' &&
    mannschaften[2]?.saison === 'TNB Vereinspokal 2026',
  mannschaften.map((m) => m.saison),
)
pruefe(
  'Saisonfilter "Sommer 2026" lässt genau 2 Mannschaften übrig',
  mannschaften.filter((m) => m.saison.toLowerCase().includes('sommer 2026')).length === 2,
)

// ---------------------------------------------------------------------------
// Namensbehandlung
// ---------------------------------------------------------------------------
console.log('\nNamensbehandlung:')
pruefe('"Herren 40 (4er)" -> "Herren 40"', normalisiereTeamName('Herren 40 (4er)') === 'Herren 40')
pruefe(
  '"Junioren B RK (2er)" -> "Junioren B RK"',
  normalisiereTeamName('Junioren B RK (2er)') === 'Junioren B RK',
)
pruefe('"Kleinfeld U8" unverändert', normalisiereTeamName('Kleinfeld U8') === 'Kleinfeld U8')
pruefe(
  '"Quoll, Malte (1981)" -> "Malte Quoll"',
  normalisiereSpielerName('Quoll, Malte (1981)') === 'Malte Quoll',
)
pruefe(
  'Namensabgleich ignoriert Titel und Schreibweise',
  namensSchluessel('Dr. Emanuel Stanek') === namensSchluessel('emanuel  stanek'),
  [namensSchluessel('Dr. Emanuel Stanek'), namensSchluessel('emanuel  stanek')],
)
pruefe(
  'verschiedene Spieler bleiben unterscheidbar',
  namensSchluessel('Malte Quoll') !== namensSchluessel('Malte Quolle'),
)

// ---------------------------------------------------------------------------
if (fehler > 0) {
  console.error(`\n${fehler} Test(s) fehlgeschlagen.`)
  process.exit(1)
}
console.log('\nAlle Tests bestanden.')
