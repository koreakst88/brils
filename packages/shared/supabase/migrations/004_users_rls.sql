-- Enable RLS on users table (if not already enabled)
alter table public.users enable row level security;

-- Allow admin to do everything with users
create policy "Admin has full access to users"
  on public.users for all to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow users to read their own row
create policy "Users can read own row"
  on public.users for select to authenticated
  using (id = auth.uid());

-- Allow anyone (anon/authenticated) to insert a new user
-- (needed for bot registration and lead conversion)
create policy "Allow insert for authenticated"
  on public.users for insert to authenticated
  with check (true);
