-- Corrige a leitura pública dos planos sem expor privilégios administrativos.

drop policy if exists "plans_public_read" on public.plans;
drop policy if exists "plans_anon_read_active" on public.plans;
drop policy if exists "plans_authenticated_read" on public.plans;

create policy "plans_anon_read_active"
on public.plans
for select
to anon
using (active = true);

create policy "plans_authenticated_read"
on public.plans
for select
to authenticated
using (active = true or public.is_admin());

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
