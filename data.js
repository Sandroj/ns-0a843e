// Startdata: jouw planning uit het projectdocument, alvast ingevuld.
// Coördinaten van geboekte plekken zijn bij benadering (marker: verifieer ter plekke).
// Alles is hierna in de app te wijzigen; dit is alleen het vertrekpunt.

window.SEED = {
  trip: {
    startDate: "2026-08-05",
    endDate: "2026-08-28",
    travelers: "2 volwassenen + 2 jonge kinderen",
    vehicle: "Auto",
    notes: "Kamperen als hoofdvorm, afgewisseld met appartement/hotel. Weinig verhuisdagen, rust boven strak schema.",
  },

  // status: vast | waarschijnlijk | idee | uitzoeken
  stays: [
    { id: "s-heenreis", name: "Onderweg (heenreis)", type: "onderweg", status: "vast",
      startDate: "2026-08-05", endDate: "2026-08-08", location: "Frankrijk richting Noord-Spanje",
      coords: null, website: "", booking: "", notes: "Twee tussenovernachtingen onderweg." },

    { id: "s-lapaz", name: "Camping La Paz", type: "camping", status: "vast",
      startDate: "2026-08-08", endDate: "2026-08-13", location: "Asturias kust (bij Ribadesella)",
      coords: [43.4625, -5.0010], website: "", booking: "Geboekt",
      notes: "Ontspannen begin. Strand, kust, wandelen, kinderen. Zonsverduistering op 12 aug vanaf de kust." },

    { id: "s-oviedo", name: "Appartement Oviedo", type: "appartement", status: "vast",
      startDate: "2026-08-13", endDate: "2026-08-16", location: "Oviedo",
      coords: [43.3619, -5.8494], website: "", booking: "",
      notes: "Stad als uitvalsbasis: Senda del Oso, Oviedo, Lagos de Covadonga." },

    { id: "s-tussen", name: "Tussenovernachting", type: "hotel", status: "uitzoeken",
      startDate: "2026-08-16", endDate: "2026-08-17", location: "N-625 / Riaño e.o.",
      coords: [42.9820, -5.0060], website: "", booking: "",
      notes: "NOG TE BOEKEN. Onderweg van Lagos de Covadonga naar Picos, via Cangas de Onís / Riaño." },

    { id: "s-viorna", name: "Camping La Viorna", type: "camping", status: "vast",
      startDate: "2026-08-17", endDate: "2026-08-22", location: "Potes (Picos de Europa)",
      coords: [43.1530, -4.6330], website: "", booking: "Geboekt",
      notes: "Hoogalpien deel. Geen verplaatsingen meer. Fuente Dé, dagtocht Caín, Potes, rustdagen." },

    { id: "s-terug", name: "Terugreis richting Frankrijk", type: "onderweg", status: "uitzoeken",
      startDate: "2026-08-22", endDate: "2026-08-28", location: "Spanje -> Frankrijk",
      coords: null, website: "", booking: "",
      notes: "Flexibel, nog in te vullen." },
  ],

  // priority: must | nice | idee    childFriendly: true/false
  activities: [
    { id: "a-eclips", name: "Zonsverduistering", category: "hoogtepunt", priority: "must",
      childFriendly: true, coords: [43.4625, -5.0010], location: "Asturias kust",
      notes: "12 augustus, vanaf de kust bekijken. Geen verhuisdag; daarna terug naar Camping La Paz." },
    { id: "a-senda", name: "Senda del Oso", category: "wandeling", priority: "must",
      childFriendly: true, coords: [43.2560, -6.0810], location: "Asturias",
      notes: "Kindvriendelijke wandeling of fietstocht." },
    { id: "a-covadonga", name: "Lagos de Covadonga", category: "natuur", priority: "must",
      childFriendly: true, coords: [43.2710, -4.9880], location: "Picos de Europa (west)",
      notes: "Ochtend van 16 aug, daarna door richting Picos." },
    { id: "a-fuentede", name: "Fuente Dé — kabelbaan", category: "hoogtepunt", priority: "must",
      childFriendly: true, coords: [43.1470, -4.8140], location: "Picos de Europa",
      notes: "Kabelbaan omhoog. Korte wandeling boven naar Mirador de El Cable. Richting Cabaña Verónica waarschijnlijk maar deels." },
    { id: "a-cain", name: "Dagtocht Caín (deel Ruta del Cares)", category: "wandeling", priority: "must",
      childFriendly: false, coords: [43.1660, -4.9260], location: "Caín, Picos de Europa",
      notes: "Vanuit La Viorna. Alleen een deel van de Ruta del Cares, niet de volledige route." },
    { id: "a-potes", name: "Potes (dorp)", category: "dorp", priority: "nice",
      childFriendly: true, coords: [43.1560, -4.6300], location: "Potes",
      notes: "Dorp bezoeken." },
    { id: "a-oviedo", name: "Oviedo (stad)", category: "stad", priority: "nice",
      childFriendly: true, coords: [43.3619, -5.8494], location: "Oviedo",
      notes: "Rustdag 15 aug, stad bekijken." },
    { id: "a-gijon", name: "Gijón — kust & lunch", category: "stad", priority: "idee",
      childFriendly: true, coords: [43.5450, -5.6620], location: "Gijón",
      notes: "Idee op 13 aug onderweg naar Oviedo: kust bekijken, eventueel lunch." },
    { id: "a-rust", name: "Rustdagen: rivier, zwemmen, camping", category: "rust", priority: "nice",
      childFriendly: true, coords: [43.1530, -4.6330], location: "Camping La Viorna",
      notes: "Ruimte houden voor niets doen." },
    // Niet gepland maar interessant:
    { id: "a-gaztelugatxe", name: "Gaztelugatxe", category: "idee", priority: "idee",
      childFriendly: false, coords: [43.4470, -2.7840], location: "Baskenland",
      notes: "Niet gepland, wel interessant." },
    { id: "a-alba", name: "Ruta del Alba", category: "idee", priority: "idee",
      childFriendly: false, coords: [43.2100, -5.2600], location: "Asturias",
      notes: "Niet gepland, wel interessant." },
    // Optionele tussenstops op de heenreis (aires pal aan de A10). heenreis:true →
    // wel als marker op de kaart, maar niet meegewogen in fitBounds (kaart blijft
    // op Asturië gefocust).
    { id: "a-aire-tours", name: "Aire de Tours La Longue Vue (A10)", category: "idee", priority: "idee",
      childFriendly: true, heenreis: true, coords: [47.4760, 0.7790], location: "A10 bij Tours (heenreis)",
      notes: "Rennen-stop pal aan de A10, ~12 km ten noorden van Tours: grote speeltuin met springkussen en een rijparcours met miniautootjes. Goede lunchstop." },
    { id: "a-aire-poitou", name: "Aire de Poitou-Charentes (A10)", category: "idee", priority: "idee",
      childFriendly: true, heenreis: true, coords: [46.2974, -0.3760], location: "A10 bij Niort (heenreis)",
      notes: "Rennen-stop pal aan de A10 (Ruralies, ~8 km van Niort): grote speeltuin/speeltunnel, picknick, klein landbouwmuseum, 's zomers vaak kinderanimatie." },
  ],

  // Elke dag verwijst naar een stayId. status: vast | waarschijnlijk | idee | uitzoeken
  days: [
    { date: "2026-08-05", stayId: "s-heenreis", status: "vast", title: "Heenreis", activityIds: [], notes: "Vertrek. Onderweg overnachten." },
    { date: "2026-08-06", stayId: "s-heenreis", status: "vast", title: "Heenreis", activityIds: [], notes: "Onderweg overnachten." },
    { date: "2026-08-07", stayId: "s-heenreis", status: "vast", title: "Laatste deel heenreis", activityIds: [], notes: "Door naar Asturias kust." },
    { date: "2026-08-08", stayId: "s-lapaz", status: "vast", title: "Aankomst Camping La Paz", activityIds: [], notes: "Ontspannen begin van de vakantie." },
    { date: "2026-08-09", stayId: "s-lapaz", status: "vast", title: "Kust & strand", activityIds: [], notes: "Strand, kust, wandelen, kinderen." },
    { date: "2026-08-10", stayId: "s-lapaz", status: "vast", title: "Kust & strand", activityIds: [], notes: "" },
    { date: "2026-08-11", stayId: "s-lapaz", status: "vast", title: "Kust & strand", activityIds: [], notes: "" },
    { date: "2026-08-12", stayId: "s-lapaz", status: "vast", title: "Zonsverduistering", activityIds: ["a-eclips"], notes: "Hoogtepunt. Vanaf de kust. Geen verhuisdag; na de eclips terug naar de camping." },
    { date: "2026-08-13", stayId: "s-oviedo", status: "vast", title: "Via Gijón naar Oviedo", activityIds: ["a-gijon"], notes: "Verhuisdag. Idee: kust bekijken, lunch in Gijón." },
    { date: "2026-08-14", stayId: "s-oviedo", status: "vast", title: "Senda del Oso", activityIds: ["a-senda"], notes: "Kindvriendelijke wandeling / fietstocht." },
    { date: "2026-08-15", stayId: "s-oviedo", status: "vast", title: "Oviedo — rustdag", activityIds: ["a-oviedo"], notes: "Stad bekijken." },
    { date: "2026-08-16", stayId: "s-tussen", status: "waarschijnlijk", title: "Covadonga + door naar Picos", activityIds: ["a-covadonga"], notes: "Ochtend Lagos de Covadonga. Daarna N-625 via Cangas de Onís / Riaño. Tussenovernachting nog te boeken." },
    { date: "2026-08-17", stayId: "s-viorna", status: "vast", title: "Naar Camping La Viorna", activityIds: [], notes: "Aankomst Potes / Picos. Hierna geen verplaatsingen meer." },
    { date: "2026-08-18", stayId: "s-viorna", status: "waarschijnlijk", title: "Fuente Dé", activityIds: ["a-fuentede"], notes: "Kabelbaan + korte wandeling boven." },
    { date: "2026-08-19", stayId: "s-viorna", status: "waarschijnlijk", title: "Dagtocht Caín", activityIds: ["a-cain"], notes: "Deel van de Ruta del Cares." },
    { date: "2026-08-20", stayId: "s-viorna", status: "idee", title: "Potes / rustdag", activityIds: ["a-potes", "a-rust"], notes: "Dorp + rivier / zwemmen." },
    { date: "2026-08-21", stayId: "s-viorna", status: "idee", title: "Rustdag", activityIds: ["a-rust"], notes: "Ruimte voor niets doen." },
    { date: "2026-08-22", stayId: "s-terug", status: "uitzoeken", title: "Vertrek richting Frankrijk", activityIds: [], notes: "Nog geen definitieve planning." },
    { date: "2026-08-23", stayId: "s-terug", status: "uitzoeken", title: "Terugreis", activityIds: [], notes: "Flexibel, nog in te vullen." },
    { date: "2026-08-24", stayId: "s-terug", status: "uitzoeken", title: "Terugreis", activityIds: [], notes: "" },
    { date: "2026-08-25", stayId: "s-terug", status: "uitzoeken", title: "Terugreis", activityIds: [], notes: "" },
    { date: "2026-08-26", stayId: "s-terug", status: "uitzoeken", title: "Terugreis", activityIds: [], notes: "" },
    { date: "2026-08-27", stayId: "s-terug", status: "uitzoeken", title: "Terugreis", activityIds: [], notes: "" },
    { date: "2026-08-28", stayId: "s-terug", status: "uitzoeken", title: "Thuis", activityIds: [], notes: "Einde vakantie." },
  ],

  // category: actie | paklijst
  todos: [
    { id: "t1", text: "Tussenovernachting 16 aug zoeken (Riaño e.o.)", category: "actie", done: false },
    { id: "t2", text: "Definitieve dagindeling Camping La Viorna bepalen", category: "actie", done: false },
    { id: "t3", text: "Activiteiten prioriteren (must-see / nice-to-have)", category: "actie", done: false },
    { id: "t4", text: "Route terug naar Frankrijk invullen", category: "actie", done: false },
    { id: "t5", text: "Restaurants en boodschappenlocaties toevoegen", category: "actie", done: false },
    { id: "p1", text: "Tent / kampeerspullen", category: "paklijst", done: false },
    { id: "p2", text: "Wandelschoenen", category: "paklijst", done: false },
    { id: "p3", text: "Zonnebril + zonnebrandcrème", category: "paklijst", done: false },
    { id: "p4", text: "Eclipsbril (zonsverduistering!)", category: "paklijst", done: false },
    { id: "p5", text: "Spullen voor de kinderen", category: "paklijst", done: false },
  ],
};
