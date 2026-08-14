-- Somente a conta principal pode exercer privilégios administrativos.
update public.profiles
set role = 'client', updated_at = now()
where id <> '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid
  and role <> 'client';

update public.profiles
set role = 'admin', updated_at = now()
where id = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() = '9f2d2416-247f-4cfe-ac95-419375b102d6'::uuid
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
