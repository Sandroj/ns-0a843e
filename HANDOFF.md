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

## Laatst gedaan (2026-07-26) — UI-herontwerp
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
1. Max opent https://sandroj.github.io/ns-0a843e/ op zijn telefoon → deel-knop →
   "Zet op beginscherm" (PWA). Toekomstige wijzigingen: `git push` → Pages
   redeployt automatisch.
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
