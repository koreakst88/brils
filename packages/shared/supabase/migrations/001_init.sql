create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  name text,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  country text not null check (country in ('KZ', 'UZ', 'KG', 'TM', 'Other')),
  intent text,
  products text[],
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create table if not exists public.distributors (
  id uuid primary key default gen_random_uuid(),
  country text not null unique check (country in ('KZ', 'UZ', 'KG', 'TM', 'Other')),
  telegram_id bigint,
  whatsapp text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  items jsonb,
  quantity integer,
  status text not null default 'new'
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  total integer not null default 0,
  shipped integer not null default 0,
  available integer generated always as (total - shipped) stored
);
