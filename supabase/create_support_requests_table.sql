-- supabase/create_support_requests_table.sql
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null
);

alter table public.support_requests enable row level security;

-- Anyone (anon + authenticated) may insert a support request.
-- No select/update/delete policies: the owner reads rows via the Supabase dashboard.
create policy "anyone can insert support requests"
  on public.support_requests
  for insert
  to anon, authenticated
  with check (true);
