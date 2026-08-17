// Service Worker der HTV-Punktspiele-App.
//
// Bewusst einfach gehalten: Er sorgt nur dafür, dass die App auch bei
// schlechtem Empfang (Tennishalle!) startet und sich auf dem Handy zum
// Home-Bildschirm hinzufügen lässt.
//
// Strategie: "Netz zuerst, Zwischenspeicher als Rückfallebene" für alle
// eigenen Dateien. Dadurch ist nach einem `npm run deploy` immer sofort
// die neue Fassung aktiv – ein veralteter Stand kann sich nicht festsetzen.
// Anfragen an Firebase/Firestore werden NICHT angefasst; deren
// Offline-Fähigkeit übernimmt das Firestore-SDK selbst.

const CACHE = 'htv-punktspiele-v1'

self.addEventListener('install', (event) => {
  // Sofort übernehmen, nicht auf das Schließen aller Tabs warten.
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const namen = await caches.keys()
      await Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const anfrage = event.request

  // Nur eigene GET-Anfragen zwischenspeichern.
  if (anfrage.method !== 'GET') return
  const url = new URL(anfrage.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      try {
        const antwort = await fetch(anfrage)
        if (antwort && antwort.status === 200 && antwort.type === 'basic') {
          const cache = await caches.open(CACHE)
          cache.put(anfrage, antwort.clone())
        }
        return antwort
      } catch (fehler) {
        const zwischenspeicher = await caches.match(anfrage)
        if (zwischenspeicher) return zwischenspeicher
        // Seitenaufruf ohne Netz: die zuletzt geladene Startseite ausliefern,
        // damit die App überhaupt startet (Routing passiert im Browser).
        if (anfrage.mode === 'navigate') {
          const start = await caches.match(self.registration.scope)
          if (start) return start
        }
        throw fehler
      }
    })(),
  )
})
