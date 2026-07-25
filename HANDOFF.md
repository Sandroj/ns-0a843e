# HANDOFF — noord-spanje

> Levend statusbestand. Elke AI werkt dit bij vóór het stoppen, zodat de
> volgende (Claude, Codex of Antigravity) naadloos verder kan. Kort en concreet:
> paden, commando's, exacte namen. Geen secrets — verwijs naar env-vars.

## Waar staan we
Werkende prototype-app (v1). Mobiel-first web-app voor de vakantie 5–28 aug 2026:
dashboard, planning per dag, verblijven, activiteiten, kaart (Leaflet), checklist.
Sync via Supabase (nog niet gekoppeld — `config.js` staat op `VUL_IN`). Lokaal
getest in de browser: dashboard, kaart met route, planning en weer (Open-Meteo)
werken. Vanilla JS, geen build-stap.

## Laatst gedaan (2026-07-25)
- Hele app gebouwd: `index.html`, `app.js`, `data.js`, `storage.js`, `config.js`,
  `styles.css`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `schema.sql`.
- Startdata (`data.js`) gevuld met Max' complete planning + statussen.
- Lokaal getest via `python3 -m http.server 8777` — geen console-fouten.
- README met Supabase-setup + deploy (Netlify Drop) + PWA-install.

## Volgende stap
1. **Max koppelt Supabase**: project maken, `schema.sql` runnen, URL + anon-key in
   `config.js` (zie README §1). Daarna is de sync live.
2. **Online zetten** (Netlify Drop o.i.d.) zodat de link op de telefoon werkt.
3. Openstaande reisacties: tussenovernachting 16 aug, dagindeling La Viorna,
   route terug naar Frankrijk (staan als todo's in de app).

## Valkuilen / let op
- **Lokale server bindt niet in de sandbox** (`PermissionError` op socket.bind).
  Draai `python3 -m http.server` buiten de sandbox.
- `config.js` bevat straks de anon-key (publiek leesbaar) — dat is bewust; de
  RLS staat op open access. Deel de deploy-link alleen met het gezin.
- CDN's (Leaflet, supabase-js) laden vanaf unpkg/jsdelivr — werkt online; de
  service worker cachet alleen same-origin bestanden.

## Zo verifieer je een wijziging
Geen tests/build. Check: `python3 -m http.server 8777` (buiten sandbox) →
open http://localhost:8777 → geen console-fouten, dashboard/planning/kaart laden.

## Openstaand / ideeën
- Foto's per dag/activiteit (Supabase Storage-bucket) — nog niet gebouwd.
- Offline-schrijfwachtrij (nu leest offline, schrijven vereist internet).
- Restaurants/supermarkten/tankstations als eigen laag op de kaart.
