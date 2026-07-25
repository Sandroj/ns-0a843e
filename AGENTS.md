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
Eén alinea: wat het project is, wie het gebruikt, live of prototype.

## Stack & structuur
- Taal / framework:
- Hoe draai je het lokaal:
- Belangrijke mappen:

## Zo verifieer je een wijziging
De echte check voor dit project (draai dit voordat je "klaar" zegt):
- Bijv. `npm test`, `npm run build`, of een specifiek commando. Vul in.

## Valkuilen (uit echte sessies)
- Leg hier vast wat misging, zodat de volgende AI dezelfde fout niet maakt.

## Werkafspraken
- Taal van communicatie:
- Wat de gebruiker zelf doet / niet aangeraakt wil hebben:
