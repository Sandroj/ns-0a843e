# HANDOFF — noord-spanje

> Levend statusbestand + startpunt voor de volgende AI-sessie. Kort en concreet.
> Projectkennis (stack, reisplanner, verifiëren, valkuilen) staat in `AGENTS.md` —
> niet hier herhaald. Git is de waarheid; dit bestand is het kompas.

## Waar staan we
Werkende PWA, **live gekoppeld aan Supabase** (EU/Frankfurt) én **gedeployed** op
GitHub Pages. Voor Max' gezinsvakantie Noord-Spanje, 5–28 aug 2026.

- **Live-URL:** https://sandroj.github.io/ns-0a843e/ — **redeploy = `git push`**
  (Pages bouwt automatisch; ~1 min). Repo: `Sandroj/ns-0a843e`, branch `main`.
- **Deploy-check:** `gh api repos/Sandroj/ns-0a843e/pages/builds/latest` (buiten
  sandbox i.v.m. TLS). Cache op de telefoon: zie valkuilen.
- Repo is **clean**, alles gecommit t/m `0baeaf3` (4 aug 2026).

## Laatst gedaan (2026-08-04)
Twee sessies, kleinere iteraties op heenreisplanner en kaart/weer, alle gepusht
en live:
- **Heenreisplanner**: klok-detectie vervangen door **dagknoppen (wo–za)** om
  handmatig de reisdag te kiezen i.p.v. automatisch op systeemtijd te gokken;
  schatting geklemd op 5 aug zodat testen vóór de reisdatum geen onzin toont.
- **Weer**: eerst omgezet naar een dag-slider, daarna weer **teruggedraaid naar
  de 14-daagse tegelstrip** (~5 tegels in zicht, horizontaal sleep/veeg) — de
  slider-variant beviel niet. Ongebruikte slider-restanten (`wxDash`,
  event-handler, CSS) opgeruimd. "Hoogtepunten" verwijderd, een Maps-lijst
  toegevoegd.
- **Kaart**: route-lijn tussen verblijf-markers verwijderd. **Zumaia**
  toegevoegd als 21e punt (`43,2988, -2,2569`). Alle 21 kaartpunten hebben nu
  een korte beschrijving in de popup (verblijf-/activiteiten-markers hadden dat
  al via plaats/naam).
- Getest: geen console-fouten, live gecontroleerd op sandroj.github.io/ns-0a843e/.
- SW-cache staat op `ns2026-v12`; gebruiker moet zoals gebruikelijk éénmaal
  verversen/PWA herstarten voor de nieuwe versie.
- Losstaand: vraag beantwoord over volledig vanaf mobiel werken onderweg (cloud
  Claude + GitHub-koppeling, geen laptop nodig) — geen code-wijziging, alleen
  advies.

## Laatst gedaan (2026-07-26)
Grote sessie rond de **reisplanner heenreis** en detaillering. Alles **getest** in
de browser (mobiel 375px, live Supabase read-only, geen console-fouten):
- **Reisplanner heenreis** (nieuw, dashboard, inklapbaar): vertrektijd + voortgang-
  slider → schatting per dag tot Camping La Paz met aankomsttijd (doel ≤ 15:00),
  uiterste vertrektijd op de laatste dag, en een terugreken-tip (tot welke stad
  doorrijden om de dag erna op tijd te zijn). Werkt vanaf elke sliderpositie, dus
  ook om op dag 2/3 te checken of je op schema ligt. Details: zie `AGENTS.md`.
- **Rijmodel** (`DRIVE` in `app.js`): `speed` = puur rijden (100 km/u); **pauzes
  (45 min per 3 u) en eten (nu 75 min = vijf kwartier) staan er apart bij**, met
  aankomst-kloktijd per dag. Getoonde rijtijd = alleen rijden.
- **Preciezere ritten + reistijd overal** via `travelInfo`/`ROUTE_LEGS`: La Paz→
  Gijón→Oviedo (±110 km), Oviedo→Covadonga binnendoor via Parque de Redes
  (129 km/2u36), Covadonga→Potes met tussenovernachting (±199 km), Riaño→La Viorna
  (55 km). Zichtbaar op tijdlijn, planning-badges en dagdetail.
- **Dashboard**: dag-bolletjes tonen weekdag + datum; locatieblokken zijn
  inklapbaar (native `<details>`, open-state in `openCards`).
- **Checklist**: paklijst-sectie verwijderd (moet elders/langer; nog te bepalen
  waar). Paklijst-todo's staan nog wél in de Supabase-blob, alleen niet getoond.
- **App-icoon**: zonsverduistering. **PNG's** (180/192/512) toegevoegd voor iOS,
  `icon.svg` blijft voor Android/overig. SW-cache `ns2026-v3`.

## Volgende stap
1. **Op de telefoon verversen** om de nieuwe versie/icoon te zien (PWA cachet):
   pull-to-refresh, of app afsluiten/heropenen; bij twijfel icoon van beginscherm
   halen en opnieuw "op beginscherm zetten".
2. Openstaande reisinhoud (staat ook als todo's ín de app): tussenovernachting
   16 aug boeken (Riaño e.o.), dagindeling Camping La Viorna, route terug.
3. Op verzoek besproken maar nog niet gebouwd: **terugreis-planner** (22–28 aug)
   op dezelfde leest als de heenreis-planner.
4. Reisplanner kalibreren indien nodig: `DRIVE`/`CORRIDOR`/`HEEN_START` in `app.js`
   (o.a. vertrekpunt = aanname Utrecht).

## Valkuilen / let op
- Zie `AGENTS.md` voor de terugkerende valkuilen (sandbox-server, Supabase-URL,
  anon-key publiek, **live app leest uit Supabase niet data.js**, iOS-PWA wil PNG,
  SW-cache bumpen, planner testen via `heenOutHTML(...)` in de console).
- App is **live gekoppeld** (last-write-wins). Bij handmatig testen: pas geen
  velden aan, anders overschrijf je Max' echte reisdata. Klikken/slider/inklappen
  schrijft niets weg (reisplanner slaat lokaal op in localStorage) — dat is veilig.

## Openstaand / ideeën
- Terugreis-planner (zie boven).
- Nieuwe plek voor een uitgebreide paklijst.
- Offline-schrijfwachtrij (nu leest offline, schrijven vereist internet).
- Foto's per dag/activiteit (Supabase Storage), restaurants/supermarkten als
  kaartlaag. Meerdere reizen: elk een eigen `TRIP_ID` in `config.js`.
