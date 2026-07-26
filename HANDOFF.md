# HANDOFF — noord-spanje

> Levend statusbestand + startpunt voor de volgende AI-sessie. Kort en concreet.
> Projectkennis (stack, verifiëren, valkuilen) staat in `AGENTS.md` — niet hier herhaald.

## Waar staan we
Werkende v1, **live gekoppeld aan Supabase** (EU/Frankfurt). Sync is getest en
werkt: de app leest/schrijft de hele reis naar tabel `trip_state` (rij-id
`noord-spanje-2026`, nu 6 verblijven + 24 dagen). Draait nog alleen lokaal op
`localhost:8777`; nog **niet online gedeployed**, dus nog niet op Max' telefoon.
Repo is schoon (laatste commit: Supabase-koppeling).

## Laatst gedaan (2026-07-25)
- Hele app gebouwd en lokaal getest (dashboard, planning, verblijven,
  activiteiten, kaart met route, checklist, weer) — **getest**, geen console-fouten.
- Supabase gekoppeld: `schema.sql` gedraaid, sleutels in `config.js`, EU/Frankfurt.
  Verbinding + seed-write geverifieerd via REST (status 200) — **getest**.
- `AGENTS.md` project-sectie ingevuld; `README.md` met setup/deploy/PWA-uitleg.

## Volgende stap
1. **Online zetten** zodat de app op de telefoon werkt: map naar
   https://app.netlify.com/drop slepen → link → op telefoon "Zet op beginscherm".
   (Max wilde hier doorheen geloodst worden; hij koos nog geen host definitief —
   Netlify Drop is het voorstel, Cloudflare Pages/Vercel is alternatief.)
2. Openstaande reisinhoud (staat ook als todo's ín de app): tussenovernachting
   16 aug boeken, dagindeling Camping La Viorna, route terug naar Frankrijk.
3. Optioneel op verzoek: foto's per dag/activiteit (Supabase Storage-bucket),
   restaurants/supermarkten als kaartlaag.

## Valkuilen / let op
- Zie `AGENTS.md` voor de terugkerende valkuilen (sandbox-server, URL zonder
  `/rest/v1/`, anon-key is bewust publiek).
- Sync niet met twéé apparaten tegelijk hetzelfde veld bewerken (last-write-wins).

## Openstaand / ideeën
- Offline-schrijfwachtrij (nu leest offline, schrijven vereist internet).
- Meerdere reizen: elk een eigen `TRIP_ID` in `config.js`.
