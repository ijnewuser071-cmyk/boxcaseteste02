-- Solicitações de pagamento Pix com confirmação manual pelo administrador.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  pix_txid text not null unique,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'paid', 'rejected', 'expired', 'cancelled')),
  requested_at timestamptz not null default now(),
  reported_paid_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_requests_client_idx on public.payment_requests(client_id, created_at desc);
create index if not exists payment_requests_status_idx on public.payment_requests(status, created_at desc);
drop trigger if exists payment_requests_set_updated_at on public.payment_requests;
create trigger payment_requests_set_updated_at before update on public.payment_requests for each row execute function public.set_updated_at();

alter table public.payment_requests enable row level security;

drop policy if exists "payment_requests_select_own" on public.payment_requests;
create policy "payment_requests_select_own" on public.payment_requests for select to authenticated
using (exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())) or public.is_admin());

drop policy if exists "payment_requests_admin_update" on public.payment_requests;
create policy "payment_requests_admin_update" on public.payment_requests for update to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.payment_requests to authenticated;
grant update on public.payment_requests to authenticated;

create or replace function public.report_pix_payment(requested_plan_id uuid, requested_txid text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  resolved_client_id uuid;
  resolved_amount integer;
  result_id uuid;
begin
  select id into resolved_client_id from public.clients where user_id = auth.uid();
  if resolved_client_id is null then raise exception 'Client profile not found'; end if;

  select price_cents into resolved_amount from public.plans where id = requested_plan_id and active = true;
  if resolved_amount is null then raise exception 'Plan unavailable'; end if;

  insert into public.payment_requests (client_id, plan_id, amount_cents, pix_txid, status, reported_paid_at)
  values (resolved_client_id, requested_plan_id, resolved_amount, requested_txid, 'under_review', now())
  on conflict (pix_txid) do update set status = 'under_review', reported_paid_at = coalesce(public.payment_requests.reported_paid_at, now())
  returning id into result_id;
  return result_id;
end;
$$;

revoke all on function public.report_pix_payment(uuid, text) from public, anon;
grant execute on function public.report_pix_payment(uuid, text) to authenticated;

create or replace function public.confirm_pix_payment(payment_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  payment public.payment_requests;
  selected_plan public.plans;
  new_subscription_id uuid;
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  select * into payment from public.payment_requests where id = payment_request_id for update;
  if payment.id is null or payment.status <> 'under_review' then raise exception 'Payment unavailable for confirmation'; end if;
  select * into selected_plan from public.plans where id = payment.plan_id;

  insert into public.subscriptions (client_id, plan_code, plan_name, price_cents, starts_at, ends_at, status, last_payment_at, next_payment_at, payment_reference)
  values (payment.client_id, selected_plan.code, selected_plan.name, payment.amount_cents, current_date, current_date + 30, 'active', now(), now() + interval '30 days', payment.pix_txid)
  returning id into new_subscription_id;

  update public.payment_requests set status = 'paid', confirmed_at = now(), confirmed_by = auth.uid(), subscription_id = new_subscription_id where id = payment.id;
  update public.clients set status = 'active' where id = payment.client_id;
  return new_subscription_id;
end;
$$;

revoke all on function public.confirm_pix_payment(uuid) from public, anon;
grant execute on function public.confirm_pix_payment(uuid) to authenticated;

drop policy if exists "payment_requests_admin_all" on public.payment_requests;
create policy "payment_requests_admin_all" on public.payment_requests for all to authenticated
using (public.is_admin()) with check (public.is_admin());
