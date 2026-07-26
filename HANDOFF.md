# HANDOFF — noord-spanje

> Levend statusbestand + startpunt voor de volgende AI-sessie. Kort en concreet.
> Projectkennis (stack, verifiëren, valkuilen) staat in `AGENTS.md` — niet hier herhaald.

## Waar staan we
Werkende v1, **live gekoppeld aan Supabase** (EU/Frankfurt) én **online gedeployed**
op GitHub Pages. Sync is getest en werkt: de app leest/schrijft de hele reis naar
tabel `trip_state` (rij-id `noord-spanje-2026`, nu 6 verblijven + 24 dagen).

- **Live-URL:** https://sandroj.github.io/ns-0a843e/ (getest: HTTP 200, Supabase
  verbindt, geen console-fouten). Onraadbare repo-naam gekozen i.v.m. open RLS.
- **GitHub-repo:** `Sandroj/ns-0a843e` (publiek), remote `origin`, branch `main`.
  Pages serveert `main` / root. **Redeploy = gewoon `git push`** (Pages bouwt auto).
- Max moet de link op zijn telefoon nog "op beginscherm zetten" (PWA-install).

## Laatst gedaan (2026-07-26) — reisplanner + preciezere ritten
- **Dag-bolletjes tonen nu weekdag + datum** (WO 5, DO 6…) i.p.v. alleen het getal.
- **Reisplanner heenreis** (nieuw, dashboard, inklapbaar): twee invoeren —
  **vertrektijd** (wo 5 aug) en een **voortgang-slider** ("hoever zijn jullie?",
  0–1650 km, met stad-label). Output: schatting per dag tot Camping La Paz met
  aankomsttijd (doel ≤ 15:00). Eerste dag rijdt door tot `day1End` (22:00, kinderen
  slapen in de auto); tussendagen 9:00–19:00. Onderweg (slider > 0) plant hij vanaf
  die positie met relatieve labels ("Komende rijdag / De dag erna"). **Terugreken-tip
  (punt 4):** toont tot welke stad je door moet rijden (≈ km 1221 / Bayonne) om de
  dag erna vóór 15:00 aan te komen. Rijmodel in `DRIVE`, corridor NL→Asturië in
  `CORRIDOR` (cumulatieve km vanaf **Utrecht** — aanname, makkelijk aanpasbaar).
  Logica: `planHeenreis(startHour, startPos)` / `heenOutHTML(depart, pos)` /
  `refreshHeen()`. Beide invoeren in **localStorage** (`heenreis-depart`,
  `heenreis-pos`), raken de Supabase-reisdata dus niet.
- **Locatieblokken bij Start zijn inklapbaar** (native `<details>`, `leg-<stayId>`);
  standaard open = blok met vandaag, anders het eerste. Onthouden via `openCards`.
- **Preciezere afstanden + reistijd overal** (punt 6/7/8/9). Nieuwe helper
  `travelInfo(date)` → `{km, min, legs}`. Specifieke ritten staan in **`ROUTE_LEGS`**
  (map op datum, in `app.js` — bewust níét in de Supabase-blob):
  - 13 aug: La Paz → Gijón (80/1u) + Gijón → Oviedo (30/30min) = ±110 km.
  - 16 aug: Oviedo → Covadonga binnendoor via Parque de Redes (129/2u36) +
    Covadonga → overnachting richting Potes/Riaño (70/1u30) = ±199 km.
  - 17 aug: Riaño → La Viorna via Puerto de San Glorio (55/1u20).
  Dagen zonder expliciete leg gebruiken de oude hemelsbrede schatting × ~70 km/u.
- **Paklijst weg onder "Lijst"** (alleen nog "Openstaande acties"). De paklijst-todos
  staan nog wél in de Supabase-blob (bewust niet verwijderd), maar worden niet getoond.
- **Nieuw app-icoon**: zonsverduistering (corona-ring + donkere maan), `icon.svg`;
  manifest-kleuren naar donker (`#0b1020`). SW-cache naar `ns2026-v2` (forceert
  verse assets bij deploy).
- **Getest** in de browser (mobiel 375px, live Supabase, read-only): geen
  console-fouten; planner om 12:00 → Parijs/Bayonne/aankomst vr 14:30, om 17:00 →
  Antwerpen/Poitiers/Santander/aankomst za 10:25.

## Vorige sessie (2026-07-26) — UI-herontwerp
- Volledige restyling (`styles.css`): gradient-hero, zachte schaduwen, glasachtige
  onderbalk, verfijnde typografie, light/dark. **Getest** in de browser (mobiel
  375px), geen console-fouten.
- **Dashboard opent nu met een reis-tijdlijn**: per locatie een blok met een
  gekleurd bolletje per dag (kleur = verblijf, op index via `PALETTE`/`stayColor`).
  Bolletjes zijn klikbaar → dagdetail in "Deze dag" (`SELDAY` + `fillDayDetail`).
- **Reisdagen tonen geschatte km** (`travelKm`: haversine × 1.3, afgerond op 10;
  null als een verblijf geen coords heeft → toont "reisdag"). Zichtbaar op de
  tijdlijn, als badge in de planning en in het dagdetail.
- **Planning/verblijven/activiteiten zijn compacte inklapkaarten** (native
  `<details>`); open-state blijft behouden over re-renders via `openCards`-Set.
- **Coördinaten-invoervelden verwijderd** uit de formulieren (kaart + weer draaien
  nog gewoon op de coords die in de data staan). **Kindvriendelijk-veld weg.**
- Vorige sessie (25-07): app gebouwd, Supabase gekoppeld (EU/Frankfurt), README.

## Let op bij testen
- App is **live gekoppeld aan Supabase** (last-write-wins). Bij handmatig testen
  in de browser: pas geen velden aan, anders overschrijf je Max' echte reisdata.
  Klikken op bolletjes en in-/uitklappen schrijft niets weg — dat is veilig.

## Volgende stap
1. **Deployen**: `git push` → GitHub Pages redeployt automatisch. (Deze sessie is
   lokaal gecommit maar nog niet gepusht — Max besluit wanneer live.)
2. Reisplanner ijken: `HEEN_START`/`CORRIDOR`/`DRIVE` in `app.js` aanpassen als
   het vertrekpunt niet Utrecht is of het rijtempo anders voelt. Eventueel een
   terugreis-planner (22–28 aug) op dezelfde leest.
3. Openstaande reisinhoud (staat ook als todo's ín de app): tussenovernachting
   16 aug boeken, dagindeling Camping La Viorna, route terug naar Frankrijk.
4. Paklijst hoort volgens Max ergens anders (langer) — nog te bepalen waar.
5. Optioneel op verzoek: foto's per dag/activiteit (Supabase Storage-bucket),
   restaurants/supermarkten als kaartlaag.

## Valkuilen / let op
- Zie `AGENTS.md` voor de terugkerende valkuilen (sandbox-server, URL zonder
  `/rest/v1/`, anon-key is bewust publiek).
- Sync niet met twéé apparaten tegelijk hetzelfde veld bewerken (last-write-wins).

## Openstaand / ideeën
- Offline-schrijfwachtrij (nu leest offline, schrijven vereist internet).
- Meerdere reizen: elk een eigen `TRIP_ID` in `config.js`.
