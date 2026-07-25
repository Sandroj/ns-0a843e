-- Plak dit in Supabase -> SQL Editor -> New query -> Run.
-- Eén tabel, één rij per reis. De hele reis staat als JSON in 'state'.

create table if not exists trip_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Family-app zonder logins: iedereen met de anon-sleutel + link mag lezen/schrijven.
-- (De sleutel zit in de app; deel de link dus alleen met je gezin.)
alter table trip_state enable row level security;

drop policy if exists "open access" on trip_state;
create policy "open access" on trip_state
  for all using (true) with check (true);

-- Realtime aanzetten zodat laptop en telefoon elkaars wijzigingen zien.
alter publication supabase_realtime add table trip_state;
