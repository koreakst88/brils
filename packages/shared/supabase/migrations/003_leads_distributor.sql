-- Add status, name, whatsapp to leads table if they do not exist
alter table public.leads add column if not exists status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost'));
alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists whatsapp text;

-- Add country, whatsapp to users table if they do not exist
alter table public.users add column if not exists country text;
alter table public.users add column if not exists whatsapp text;
