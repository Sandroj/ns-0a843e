// Opslag- en sync-laag. Eén JSON-blob per reis in Supabase.
// ponytail: hele reis als één rij, last-write-wins. Prima voor 1 gezin dat zelden
// tegelijk op hetzelfde veld tikt. Upgradepad bij conflicten: per-entiteit rijen.

const Store = (() => {
  const cfg = window.CONFIG;
  const configured = cfg.SUPABASE_URL !== "VUL_IN" && cfg.SUPABASE_ANON_KEY !== "VUL_IN";
  let sb = null;
  if (configured) sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  let saveTimer = null;

  async function load() {
    if (!configured) return { state: structuredClone(window.SEED), offline: true };
    const { data, error } = await sb.from("trip_state").select("state").eq("id", cfg.TRIP_ID).maybeSingle();
    if (error) throw error;
    if (data) return { state: data.state, offline: false };
    // Eerste keer: seed wegschrijven.
    const seed = structuredClone(window.SEED);
    const { error: insErr } = await sb.from("trip_state").insert({ id: cfg.TRIP_ID, state: seed });
    if (insErr) throw insErr;
    return { state: seed, offline: false };
  }

  // Debounced zodat snel typen niet elke toetsaanslag wegschrijft.
  function save(state, { onSaved, onError } = {}) {
    if (!configured) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { error } = await sb.from("trip_state")
        .upsert({ id: cfg.TRIP_ID, state, updated_at: new Date().toISOString() });
      if (error) { onError && onError(error); } else { onSaved && onSaved(); }
    }, 600);
  }

  // Realtime: roept cb(newState) aan als het andere apparaat iets wijzigt.
  function subscribe(cb) {
    if (!configured) return () => {};
    const ch = sb.channel("trip-" + cfg.TRIP_ID)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "trip_state", filter: "id=eq." + cfg.TRIP_ID },
        (payload) => { if (payload.new && payload.new.state) cb(payload.new.state); })
      .subscribe();
    return () => sb.removeChannel(ch);
  }

  return { load, save, subscribe, configured };
})();
