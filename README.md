# Noord-Spanje 2026 — vakantie-app

Mobiel-first web-app voor de zomervakantie (5–28 aug 2026). Planning per dag,
verblijven, activiteiten, kaart en checklist. Wijzigingen synct via Supabase
tussen laptop en telefoon. Werkt als PWA (installeerbaar op je telefoon).

## Bestanden
| Bestand | Doet |
|---|---|
| `index.html` | schil + navigatie |
| `app.js` | alle views, bewerken, kaart, weer |
| `data.js` | startdata (jouw planning) — alleen bij eerste keer geladen |
| `storage.js` | laden/opslaan/realtime via Supabase |
| `config.js` | **jouw Supabase-sleutels (invullen)** |
| `schema.sql` | database-tabel (1× in Supabase draaien) |
| `styles.css`, `sw.js`, `manifest.webmanifest`, `icon.svg` | opmaak + PWA |

## 1. Supabase opzetten (~2 min)
1. Maak een gratis account + project op https://supabase.com (geen creditcard).
2. Open **SQL Editor → New query**, plak de inhoud van `schema.sql`, klik **Run**.
3. Ga naar **Project Settings → API**. Kopieer **Project URL** en de **anon public** sleutel.
4. Zet beide in `config.js` (vervang de twee `VUL_IN`-waarden).

Klaar — de app maakt bij de eerste keer laden zelf de startdata aan.

> De anon-sleutel zit zichtbaar in de app en iedereen met de link kan bewerken.
> Dat is bewust simpel gehouden voor gezinsgebruik: **deel de link alleen met je gezin.**

## 2. Lokaal bekijken
```
cd ~/claude-code/projects/noord-spanje
python3 -m http.server 8777
```
Open http://localhost:8777

## 3. Online zetten (zodat je 'm op je telefoon opent)
De app is statisch — sleep de map naar een gratis host:
- **Netlify Drop**: https://app.netlify.com/drop — map erin slepen, je krijgt direct een URL.
- of **Cloudflare Pages** / **Vercel** / **GitHub Pages**.

Je krijgt een link als `https://...netlify.app`. Die open je op elk apparaat.

## 4. Op je telefoon installeren
Open de link in Safari (iPhone) of Chrome (Android) → **Deel / menu → Zet op
beginscherm**. Nu staat er een app-icoon; hij opent schermvullend en werkt
offline voor de schil (data heeft internet nodig).

## Statussen
`vast` · `waarschijnlijk` · `idee` · `uitzoeken` — per dag en per verblijf in te stellen.

## Bewust simpel gehouden (uitbreiden wanneer nodig)
- **Sync = hele reis als één blob, last-write-wins.** Twee mensen die exact
  tegelijk hetzelfde veld wijzigen kunnen elkaar overschrijven. Prima voor één
  gezin; upgradepad = per onderdeel opslaan. → `storage.js`
- **Geen offline-schrijfwachtrij.** Zonder internet kun je lezen (laatste schil),
  maar wijzigingen hebben verbinding nodig. → `sw.js`
- **Foto's** uit het datamodel zitten er nog niet in (kost opslag-buckets); toe
  te voegen zodra je ze wilt.
