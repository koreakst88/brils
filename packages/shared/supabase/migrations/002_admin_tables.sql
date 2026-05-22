-- Drop tables if they already exist
drop table if exists public.activity_log cascade;
drop table if exists public.pricing cascade;
drop table if exists public.inventory_transactions cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;

-- 1. orders (заказы)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid references public.users(id) on delete set null,
  items jsonb not null,
  total_amount numeric not null default 0,
  status text not null default 'new' check (status in ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- 2. payments (платежи)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric not null default 0,
  due_date date not null,
  paid_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- 3. inventory_transactions (движение товаров)
create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  quantity integer not null,
  type text not null check (type in ('incoming', 'outgoing')),
  order_id uuid references public.orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- 4. pricing (прайс-лист)
create table public.pricing (
  id uuid primary key default gen_random_uuid(),
  product text unique not null,
  price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- 5. activity_log (история действий)
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Function for automatic updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.orders
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.payments
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.inventory_transactions
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.pricing
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.pricing enable row level security;
alter table public.activity_log enable row level security;

-- RLS Policies

-- orders
create policy "Admin has full access to orders"
  on public.orders for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Owner has read-only access to orders"
  on public.orders for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'owner'));

-- payments
create policy "Admin has full access to payments"
  on public.payments for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Owner has read-only access to payments"
  on public.payments for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'owner'));

-- inventory_transactions
create policy "Admin has full access to inventory_transactions"
  on public.inventory_transactions for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Owner has read-only access to inventory_transactions"
  on public.inventory_transactions for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'owner'));

-- pricing
create policy "Admin has full access to pricing"
  on public.pricing for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Owner has read-only access to pricing"
  on public.pricing for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'owner'));

-- activity_log
create policy "Admin has full access to activity_log"
  on public.activity_log for all to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Owner has read-only access to activity_log"
  on public.activity_log for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'owner'));
