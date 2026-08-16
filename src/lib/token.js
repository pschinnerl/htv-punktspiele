// Erzeugt einen zufälligen, URL-sicheren Zugangstoken (Standard: 24 Zeichen).
// Zeichensatz ohne leicht verwechselbare Zeichen (0/O, 1/l/I).
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function erzeugeToken(length = 24) {
  const zufall = new Uint32Array(length)
  crypto.getRandomValues(zufall)
  return Array.from(zufall, (n) => CHARS[n % CHARS.length]).join('')
}
