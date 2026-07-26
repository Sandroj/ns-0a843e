<!-- ════════════════ AI-START — lees dit eerst, elke sessie ════════════════ -->
<!-- Dit blok is tool-neutraal. Claude, Codex en Antigravity lezen dit bestand
     bij het opstarten (via AGENTS.md, of via de symlinks CLAUDE.md / GEMINI.md).
     Bewerk de flow-regels hieronder alleen bewust — ze houden het project
     doorontwikkelbaar over meerdere AI's en sessies heen. -->

# Doorontwikkel-flow (elke AI, elke sessie)

Dit project gebruikt een tool-neutrale flow zodat elke AI — of het nu Claude,
Codex of Antigravity is — naadloos verder kan waar de vorige stopte. **Git is de
waarheid; `HANDOFF.md` is het kompas.**

## Zodra je op dit project wordt gericht

1. Oriënteer op de echte stand: `git status` en `git log --oneline -12`.
2. Lees **`HANDOFF.md`** — daar staat waar de vorige sessie stopte en wat de
   volgende stap is. Lees ook de rest van dit bestand (project-instructies).
3. Pak "Volgende stap" uit `HANDOFF.md` op, of doe wat de gebruiker vraagt.
   Twijfel je wat de bedoeling is? Vraag het — verzin geen richting.

## Terwijl je werkt

- Commit klein en vaak, met duidelijke berichten in de gebiedende wijs
  ("Fix sync-bug in importer", niet "wijzigingen").
- Verwijder of overschrijf geen bestanden zonder overleg met de gebruiker.
- Eén AI tegelijk in deze repo. Werk je parallel, gebruik dan een aparte
  git-branch of worktree.

## Voordat je stopt (of de gebruiker weggaat)

1. **Commit al je werk** — laat de repo schoon achter (`git status` clean).
   Werk dat niet af is: commit als WIP met een duidelijk bericht.
2. **Werk `HANDOFF.md` bij**: wat je deed, wat af/getest is, de volgende stap,
   en elke valkuil die je tegenkwam. Schrijf het voor een AI die dit gesprek
   niet gezien heeft.
3. Meld de gebruiker in één zin waar het project nu staat.

<!-- ════════════════ EINDE AI-START — hieronder project-specifiek ════════════════ -->

# noord-spanje — projectinstructies

<!-- Vul dit in voor dit specifieke project. De AI-START-flow hierboven staat
     los hiervan en hoef je niet aan te passen. -->

## Wat is dit
Mobiel-first web-app voor Max' gezinsvakantie Noord-Spanje (5–28 aug 2026):
dashboard, planning per dag, verblijven, activiteiten, kaart en checklist.
Werkende v1. Data + sync via Supabase; te installeren als PWA op de telefoon.

## Stack & structuur
- **Taal / framework:** vanilla HTML/CSS/JS, geen build-stap. Leaflet + supabase-js
  via CDN, weer via Open-Meteo (geen API-sleutels behalve Supabase).
- **Hoe draai je het lokaal:** `python3 -m http.server 8777` in de projectmap
  (moet **buiten de sandbox** — anders `PermissionError` op socket.bind), dan
  http://localhost:8777.
- **Belangrijke bestanden:** `app.js` (alle views + logica), `data.js` (startdata,
  alleen bij eerste load), `storage.js` (Supabase laden/opslaan/realtime),
  `config.js` (Supabase-sleutels), `schema.sql` (DB-tabel). Zie `README.md`.
- **Data:** één tabel `trip_state`, één rij per reis (`TRIP_ID`), hele reis als
  JSONB. Supabase-project staat in **EU/Frankfurt**.

## Zo verifieer je een wijziging
Geen tests/build. Start de server (buiten sandbox) → open localhost:8777 → geen
console-fouten, en dashboard/planning/kaart laden. Supabase-verbinding checken:
in de browserconsole `fetch(CONFIG.SUPABASE_URL+'/rest/v1/trip_state?select=id',
{headers:{apikey:CONFIG.SUPABASE_ANON_KEY}})` moet status 200 geven.

## Valkuilen (uit echte sessies)
- **Lokale server bindt niet in de sandbox** — draai `python3 -m http.server`
  buiten de sandbox.
- **Supabase-URL zonder pad**: alleen `https://<ref>.supabase.co`, géén
  `/rest/v1/` erachter, anders faalt supabase-js.
- `config.js` bevat de anon-key (bewust publiek, hoort in een client-app). De
  beveiliging is link-gebaseerd (RLS = open access). **Nooit** de `service_role`-
  key of het DB-wachtwoord in de app/repo zetten.
- Sync = hele blob, last-write-wins (prima voor één gezin; zie README).

## Werkafspraken
- **Taal:** Nederlands.
- Max koppelt zelf accounts/hosts (Supabase, Netlify). Verwijder geen bestanden
  zonder overleg. Startdata in `data.js` is Max' echte planning — pas 'm alleen
  bewust aan.
