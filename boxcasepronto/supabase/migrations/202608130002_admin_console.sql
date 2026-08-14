-- Painel administrativo do Box.
-- Execute após 202608130001_box_selva_core.sql.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  frequency_per_week integer not null check (frequency_per_week > 0),
  price_cents integer not null check (price_cents >= 0),
  price_per_class_cents integer,
  description text,
  benefits jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans for each row execute function public.set_updated_at();

insert into public.plans (code, name, frequency_per_week, price_cents, price_per_class_cents, featured, sort_order)
values
  ('box-3x', 'Plano 3x', 3, 16500, 1375, false, 10),
  ('box-4x', 'Plano 4x', 4, 20000, 1250, false, 20),
  ('box-5x', 'Plano 5x', 5, 22500, 1125, true, 30),
  ('box-6x', 'Plano 6x', 6, 24000, 1000, false, 40)
on conflict (code) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.plans enable row level security;

drop policy if exists "plans_public_read" on public.plans;
create policy "plans_public_read" on public.plans for select to anon, authenticated using (active = true or public.is_admin());
drop policy if exists "plans_admin_insert" on public.plans;
create policy "plans_admin_insert" on public.plans for insert to authenticated with check (public.is_admin());
drop policy if exists "plans_admin_update" on public.plans;
create policy "plans_admin_update" on public.plans for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "plans_admin_delete" on public.plans;
create policy "plans_admin_delete" on public.plans for delete to authenticated using (public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all" on public.subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "templates_admin_all" on public.notification_templates;
create policy "templates_admin_all" on public.notification_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated;
grant select on public.profiles, public.clients, public.subscriptions, public.notification_templates, public.notifications to authenticated;
grant insert, update, delete on public.clients, public.subscriptions, public.notification_templates, public.notifications to authenticated;

insert into public.profiles (id, full_name, email, role)
select id, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)), email, 'admin'
from auth.users
where id = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid
on conflict (id) do update set role = 'admin', email = excluded.email, updated_at = now();

insert into public.clients (user_id, profile_id, name, email, status)
select u.id, u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), u.email, 'active'
from auth.users u
where u.id = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid
on conflict (user_id) do update set profile_id = excluded.profile_id, name = excluded.name, email = excluded.email;

update public.profiles
set role = 'admin', updated_at = now()
where id = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid;

do $$
begin
  if not exists (select 1 from public.profiles where id = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid and role = 'admin') then
    raise exception 'Admin profile not found. Sign in once or run the core migration trigger/backfill before this migration.';
  end if;
end;
$$;
