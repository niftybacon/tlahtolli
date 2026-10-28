-- Tlahtōlli account synchronization schema
-- Run in Supabase Dashboard > SQL Editor.
-- Auth users are created by Supabase Auth; NEVER store passwords here.
create table if not exists public.tlahtolli_study_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_key text not null check (length(card_key) between 1 and 320),
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_key)
);
alter table public.tlahtolli_study_cards enable row level security;
revoke all on public.tlahtolli_study_cards from anon;
grant select, insert, update, delete on public.tlahtolli_study_cards to authenticated;
drop policy if exists "tlahtolli_cards_read_own" on public.tlahtolli_study_cards;
create policy "tlahtolli_cards_read_own" on public.tlahtolli_study_cards
 for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "tlahtolli_cards_insert_own" on public.tlahtolli_study_cards;
create policy "tlahtolli_cards_insert_own" on public.tlahtolli_study_cards
 for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "tlahtolli_cards_update_own" on public.tlahtolli_study_cards;
create policy "tlahtolli_cards_update_own" on public.tlahtolli_study_cards
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
drop policy if exists "tlahtolli_cards_delete_own" on public.tlahtolli_study_cards;
create policy "tlahtolli_cards_delete_own" on public.tlahtolli_study_cards
 for delete to authenticated using ((select auth.uid()) = user_id);
-- Data access is restricted by auth.uid(); no public SELECT policy.
