-- Box: fundação aditiva para clientes, planos e notificações.
-- Revise em um projeto de teste antes de executar no SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  status text not null default 'lead' check (status in ('lead', 'active', 'inactive', 'blocked')),
  whatsapp_opt_in boolean not null default false,
  email_opt_in boolean not null default true,
  app_opt_in boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.clients add column if not exists profile_id uuid references public.profiles(id) on delete set null;
alter table public.clients add column if not exists name text;
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists status text not null default 'lead';
alter table public.clients add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.clients add column if not exists email_opt_in boolean not null default true;
alter table public.clients add column if not exists app_opt_in boolean not null default true;
alter table public.clients add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.clients add column if not exists created_at timestamptz not null default now();
alter table public.clients add column if not exists updated_at timestamptz not null default now();
create unique index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_phone_idx on public.clients(phone) where phone is not null;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_code text not null,
  plan_name text not null,
  price_cents integer not null check (price_cents >= 0),
  starts_at date not null default current_date,
  ends_at date not null,
  status text not null default 'active' check (status in ('pending', 'active', 'past_due', 'cancelled', 'expired')),
  auto_renew boolean not null default false,
  last_payment_at timestamptz,
  next_payment_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists subscriptions_client_id_idx on public.subscriptions(client_id);
create index if not exists subscriptions_expiration_idx on public.subscriptions(status, ends_at);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  channel text not null check (channel in ('whatsapp', 'email', 'app')),
  title text,
  body text not null,
  provider_template_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  template_id uuid references public.notification_templates(id) on delete set null,
  kind text not null default 'transactional' check (kind in ('promotion', 'expiration', 'payment', 'transactional')),
  channel text not null check (channel in ('whatsapp', 'email', 'app')),
  title text,
  message text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'queued', 'processing', 'sent', 'delivered', 'failed', 'read', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  provider_message_id text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  error_message text,
  dedupe_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;
alter table public.notifications add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.notifications add column if not exists template_id uuid references public.notification_templates(id) on delete set null;
alter table public.notifications add column if not exists kind text not null default 'transactional';
alter table public.notifications add column if not exists channel text;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists status text not null default 'draft';
alter table public.notifications add column if not exists scheduled_at timestamptz;
alter table public.notifications add column if not exists sent_at timestamptz;
alter table public.notifications add column if not exists delivered_at timestamptz;
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists provider_message_id text;
alter table public.notifications add column if not exists attempt_count integer not null default 0;
alter table public.notifications add column if not exists last_attempt_at timestamptz;
alter table public.notifications add column if not exists error_message text;
alter table public.notifications add column if not exists dedupe_key text;
alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists created_at timestamptz not null default now();
alter table public.notifications add column if not exists updated_at timestamptz not null default now();
create unique index if not exists notifications_dedupe_key_idx on public.notifications(dedupe_key) where dedupe_key is not null;
create index if not exists notifications_dispatch_idx on public.notifications(status, scheduled_at);
create index if not exists notifications_client_idx on public.notifications(client_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
drop trigger if exists notification_templates_set_updated_at on public.notification_templates;
create trigger notification_templates_set_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();
drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at before update on public.notifications for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  resolved_name text;
begin
  resolved_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  insert into public.profiles (id, full_name, email)
  values (new.id, resolved_name, new.email)
  on conflict (id) do update set full_name = excluded.full_name, email = excluded.email;

  insert into public.clients (user_id, profile_id, name, email, status)
  values (new.id, new.id, resolved_name, new.email, 'lead')
  on conflict (user_id) do update set name = excluded.name, email = excluded.email, profile_id = excluded.profile_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

create or replace function public.queue_expiration_reminders()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  inserted_count integer;
begin
  insert into public.notifications (client_id, subscription_id, template_id, kind, channel, title, message, status, scheduled_at, dedupe_key, metadata)
  select s.client_id, s.id,
    (select nt.id from public.notification_templates nt where nt.code = concat('plan_expires_', case (s.ends_at - current_date) when 7 then '7d' when 3 then '3d' when 1 then '1d' else 'today' end) limit 1),
    'expiration', 'whatsapp', 'Seu plano está perto do vencimento',
    case (s.ends_at - current_date)
      when 7 then 'Olá, {{name}}! Seu plano {{plan_name}} vence em 7 dias. Fale conosco para renovar.'
      when 3 then 'Olá, {{name}}! Faltam 3 dias para o seu plano {{plan_name}} vencer. Vamos renovar?'
      when 1 then 'Olá, {{name}}! Seu plano {{plan_name}} vence amanhã. Renove para continuar treinando sem interrupções.'
      else 'Olá, {{name}}! Seu plano {{plan_name}} vence hoje. Fale conosco para regularizar o pagamento.'
    end,
    'queued', now(), concat('expiration:', s.id, ':', s.ends_at - current_date),
    jsonb_build_object('days_remaining', s.ends_at - current_date, 'plan_name', s.plan_name, 'ends_at', s.ends_at)
  from public.subscriptions s
  join public.clients c on c.id = s.client_id
  where s.status in ('active', 'past_due')
    and s.ends_at - current_date in (7, 3, 1, 0)
    and c.whatsapp_opt_in = true
    and c.phone is not null
  on conflict (dedupe_key) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())));
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())));
drop policy if exists "notifications_update_own_read" on public.notifications;

revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
revoke update on public.clients from authenticated;
grant update (phone, whatsapp_opt_in, email_opt_in, app_opt_in) on public.clients to authenticated;
revoke insert, update, delete on public.subscriptions from authenticated;
revoke insert, update, delete on public.notification_templates from authenticated;
revoke insert, update, delete on public.notifications from authenticated;

create or replace function public.mark_notification_read(notification_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.notifications n
  set status = 'read', read_at = coalesce(n.read_at, now())
  where n.id = notification_id
    and exists (select 1 from public.clients c where c.id = n.client_id and c.user_id = auth.uid());
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

revoke all on function public.queue_expiration_reminders() from public, anon, authenticated;
grant execute on function public.queue_expiration_reminders() to service_role;

insert into public.notification_templates (code, channel, title, body, provider_template_name)
values
  ('plan_expires_7d', 'whatsapp', 'Plano vence em 7 dias', 'Olá, {{name}}! Seu plano {{plan_name}} vence em 7 dias.', 'plan_expires_7d'),
  ('plan_expires_3d', 'whatsapp', 'Plano vence em 3 dias', 'Olá, {{name}}! Faltam 3 dias para o plano {{plan_name}} vencer.', 'plan_expires_3d'),
  ('plan_expires_1d', 'whatsapp', 'Plano vence amanhã', 'Olá, {{name}}! Seu plano {{plan_name}} vence amanhã.', 'plan_expires_1d'),
  ('plan_expires_today', 'whatsapp', 'Plano vence hoje', 'Olá, {{name}}! Seu plano {{plan_name}} vence hoje.', 'plan_expires_today')
on conflict (code) do nothing;
